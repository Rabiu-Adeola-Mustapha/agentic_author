'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          setProjects(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const icons: Record<string, string> = {
    book: '📚',
    screenplay: '🎬',
    thesis: '🎓',
    journal: '📰',
    educational: '🏫',
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-sora font-bold">All Projects</h1>
        <Link href="/dashboard/projects/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Zap className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-zinc-400">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-zinc-400 mb-4">No projects yet. Create your first one!</p>
            <Link href="/dashboard/projects/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Create Project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project._id} className="hover:border-indigo-600 transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{icons[project.category]}</span>
                  <Badge
                    variant={
                      project.status === 'completed'
                        ? 'default'
                        : project.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {project.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold line-clamp-2">{project.title}</h3>
                  <p className="text-sm text-zinc-400 mt-2">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/dashboard/projects/${project._id}`} className="block">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">View Project</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
