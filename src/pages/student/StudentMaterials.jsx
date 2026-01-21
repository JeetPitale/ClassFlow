import { useState, useEffect } from 'react';
import { Download, FileText, Image, Music, Link, Search, Eye } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const typeIcons = {
  pdf: FileText,
  doc: FileText,
  slides: FileText,
  image: Image,
  audio: Music,
  link: Link
};

const typeColors = {
  pdf: 'bg-destructive/10 text-destructive',
  doc: 'bg-info/10 text-info',
  slides: 'bg-warning/10 text-warning',
  image: 'bg-success/10 text-success',
  audio: 'bg-purple-500/10 text-purple-500',
  link: 'bg-primary/10 text-primary'
};

export default function StudentMaterials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('https://classflow-backend-jeet.azurewebsites.net/api/materials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      toast({ title: 'Error', description: 'Failed to load materials', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(
    (m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (material) => {
    if (material.file_type === 'link') {
      window.open(material.file_url, '_blank');
    } else {
      // Use the new download endpoint
      // const downloadUrl = `https://classflow-backend-jeet.azurewebsites.net/api/materials/${material.id}/download?token=${token}`;

      // Use dynamic base URL from our API configuration
      const downloadUrl = `${api.defaults.baseURL}/materials/${material.id}/download?token=${token}`;

      // Open in new tab which will trigger the download prompt
      window.open(downloadUrl, '_blank');
      toast({ title: 'Download Started', description: `Downloading ${material.title}...` });
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Course Materials"
        description="Download learning materials shared by your teachers" />


      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 max-w-sm" />

      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.length === 0 && !loading ? (
          <p className="text-muted-foreground col-span-full">No materials found for your semester.</p>
        ) : (
          filteredMaterials.map((material, index) => {
            const Icon = typeIcons[material.file_type] || FileText;

            return (
              <div
                key={material.id}
                className="card-elevated p-5 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}>

                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${typeColors[material.file_type] || 'bg-gray-100'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-foreground truncate max-w-[70%]">{material.title}</h4>
                      <Badge variant="outline" className="text-xs">Sem {material.semester}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {material.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={typeColors[material.file_type] || 'bg-gray-100'}>
                      {(material.file_type || 'Unknown').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {material.created_at ? format(new Date(material.created_at + 'Z'), 'MMM d, yyyy h:mm a') : ''}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => handleDownload(material)}>
                    {material.file_type === 'link' ? <Link className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    {material.file_type === 'link' ? 'Open' : 'Download'}
                  </Button>
                  {material.file_type !== 'link' && (
                    <Button variant="ghost" size="icon" onClick={() => {
                      const viewUrl = `${api.defaults.baseURL}/materials/${material.id}/download?token=${token}&inline=true`;
                      window.open(viewUrl, '_blank');
                    }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {material.teacher_name && (
                  <p className="text-xs text-muted-foreground mt-2">Posted by: {material.teacher_name}</p>
                )}
                {material.file_type !== 'link' && (
                  <Button variant="ghost" size="icon" onClick={() => {
                    const viewUrl = `${api.defaults.baseURL}/materials/${material.id}/download?token=${token}&inline=true`;
                    window.open(viewUrl, '_blank');
                  }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
                {
              material.teacher_name && (
                <p className="text-xs text-muted-foreground mt-2">Posted by: {material.teacher_name}</p>
              )
            }
              </div>
    </div>);

}))}
    </div >
    </div >);

}