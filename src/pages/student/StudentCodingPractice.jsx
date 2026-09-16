import { Code, Terminal } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudentCodingPractice() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Coding Practice" 
        description="Enhance your programming skills with coding challenges and exercises." 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <span>Basic Syntax</span>
            </CardTitle>
            <CardDescription>
              Practice fundamental programming concepts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Practice</Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <span>Algorithms</span>
            </CardTitle>
            <CardDescription>
              Solve algorithmic problems to improve logic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Practice</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
