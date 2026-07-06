import { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2, CheckCircle, AlertCircle, FolderKanban } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface JiraIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendationTitle: string;
  recommendationDescription: string;
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
}

interface CreatedIssue {
  id: string;
  key: string;
  url: string;
  status: string;
  assignedTeam: string;
}

export function JiraIntegrationModal({
  isOpen,
  onClose,
  recommendationTitle,
  recommendationDescription,
}: JiraIntegrationModalProps) {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedIssueType, setSelectedIssueType] = useState<string>('Task');
  const [selectedPriority, setSelectedPriority] = useState<string>('High');
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');
  const [createdIssue, setCreatedIssue] = useState<CreatedIssue | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      setError('');

      const { data, error: fnError } = await supabase.functions.invoke('jira-integration?action=projects');

      if (fnError) throw fnError;
      if (data?.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0) {
          setSelectedProject(data.projects[0].key);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load Jira projects. Please check your Jira configuration.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('jira-integration?action=create-issue', {
        method: 'POST',
        body: {
          projectKey: selectedProject,
          summary: `[Cloud Cost] ${recommendationTitle}`,
          description: `**Cloud Cost Optimization Recommendation**\n\n${recommendationDescription}\n\n---\n*Created from NTT DATA Cloud Cost Intelligence Platform*`,
          issueType: selectedIssueType,
          priority: selectedPriority,
          labels: ['cloud-cost', 'optimization'],
        },
      });

      if (fnError) throw fnError;

      if (data?.key) {
        setCreatedIssue(data);
      } else {
        throw new Error('Failed to create issue');
      }
    } catch (err) {
      console.error('Error creating issue:', err);
      setError(err instanceof Error ? err.message : 'Failed to create Jira issue');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatedIssue(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-800/80">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Create Jira Task</h2>
              <p className="text-slate-500 text-sm">Create a task from this recommendation</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdIssue ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">Task Created Successfully!</h3>
              <p className="text-slate-400 mb-2">
                Task <span className="text-blue-400 font-mono">{createdIssue.key}</span> has been created.
              </p>
              <p className="text-slate-500 text-sm mb-4">
                Status: {createdIssue.status} | Project: {createdIssue.assignedTeam}
              </p>
              <a
                href={createdIssue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Open in Jira <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <>
              {/* Recommendation Preview */}
              <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Recommendation</p>
                <p className="text-white font-medium mb-2 line-clamp-1">{recommendationTitle}</p>
                <p className="text-slate-400 text-sm line-clamp-2">{recommendationDescription}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="ml-2 text-slate-400">Loading Jira projects...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Project Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Jira Project
                    </label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.key}>
                          {project.name} ({project.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Issue Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Issue Type
                    </label>
                    <select
                      value={selectedIssueType}
                      onChange={(e) => setSelectedIssueType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                    >
                      <option value="Task">Task</option>
                      <option value="Bug">Bug</option>
                      <option value="Story">Story</option>
                      <option value="Sub-task">Sub-task</option>
                      <option value="Improvement">Improvement</option>
                    </select>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Priority
                    </label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                    >
                      <option value="Highest">Highest</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Lowest">Lowest</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIssue}
                  disabled={loading || loadingProjects || !selectedProject}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
