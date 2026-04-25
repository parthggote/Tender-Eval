'use client';

import * as React from 'react';
import { FileTextIcon, FilterIcon, SearchIcon } from 'lucide-react';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';

// Mock template data - in real app this would come from API
const MOCK_TEMPLATES = [
  {
    id: '1',
    title: 'IT Services Procurement',
    description: 'Standard template for technology services, software licensing, and IT consulting contracts.',
    category: 'Technology',
    criteriaCount: 12,
    tags: ['IT', 'Software', 'Consulting'],
  },
  {
    id: '2', 
    title: 'Construction & Infrastructure',
    description: 'Comprehensive evaluation for building projects, civil works, and infrastructure development.',
    category: 'Construction',
    criteriaCount: 18,
    tags: ['Construction', 'Infrastructure', 'Engineering'],
  },
  {
    id: '3',
    title: 'Professional Services',
    description: 'General template for consulting, advisory, and professional service engagements.',
    category: 'Services',
    criteriaCount: 8,
    tags: ['Consulting', 'Advisory', 'Professional'],
  },
  {
    id: '4',
    title: 'Medical Equipment & Supplies',
    description: 'Specialized criteria for healthcare equipment, medical devices, and pharmaceutical supplies.',
    category: 'Healthcare',
    criteriaCount: 15,
    tags: ['Medical', 'Healthcare', 'Equipment'],
  },
  {
    id: '5',
    title: 'Facilities Management',
    description: 'Template for cleaning, maintenance, security, and other facility management services.',
    category: 'Services',
    criteriaCount: 10,
    tags: ['Facilities', 'Maintenance', 'Security'],
  },
  {
    id: '6',
    title: 'Transportation & Logistics',
    description: 'Evaluation criteria for freight, delivery, vehicle procurement, and logistics services.',
    category: 'Transportation',
    criteriaCount: 14,
    tags: ['Transport', 'Logistics', 'Delivery'],
  },
];

const CATEGORIES = ['All', 'Technology', 'Construction', 'Services', 'Healthcare', 'Transportation'];

type TemplateBrowserDialogProps = {
  agencySlug: string;
  onTemplateSelect?: (templateId: string) => void;
};

export function TemplateBrowserDialog({ 
  agencySlug, 
  onTemplateSelect 
}: TemplateBrowserDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredTemplates = React.useMemo(() => {
    return MOCK_TEMPLATES.filter(template => {
      const matchesSearch = searchQuery === '' || 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect?.(templateId);
    setOpen(false);
    // In real app, this would navigate to template setup or create tender with template
    console.log(`Selected template: ${templateId} for agency: ${agencySlug}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Browse Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">Template Library</DialogTitle>
          <DialogDescription>
            Choose a pre-built evaluation template to get started quickly.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FilterIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-medium text-muted-foreground mb-1">No templates found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or category filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group relative rounded-lg border border-border bg-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                        <FileTextIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {template.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{template.criteriaCount} criteria</span>
                      <div className="flex gap-1">
                        {template.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            +{template.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}