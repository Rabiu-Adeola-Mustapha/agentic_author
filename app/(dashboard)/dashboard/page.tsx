'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  category: string;
  status: string;
  currentStage: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.slice(0, 5));
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

  const stats = [
    {
      label: 'Total Projects',
      value: projects.length,
      icon: '📊',
    },
    {
      label: 'Completed',
      value: projects.filter((p) => p.status === 'completed').length,
      icon: '✅',
    },
    {
      label: 'In Progress',
      value: projects.filter((p) => p.status === 'running').length,
      icon: '⚡',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-sora font-bold mb-2">Welcome back!</h1>
        <p className="text-zinc-400">Create your next masterpiece with Agentic Author</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-sora font-bold">Recent Projects</h2>
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
              <p className="text-zinc-400 mb-4">No projects yet. Start creating!</p>
              <Link href="/dashboard/projects/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Create Project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project._id} className="hover:border-indigo-600 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-3xl">{icons[project.category]}</span>
                      <div>
                        <h3 className="font-semibold">{project.title}</h3>
                        <p className="text-sm text-zinc-400">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                      <Link href={`/dashboard/projects/${project._id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
