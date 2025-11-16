import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import PageHeader from '../../components/ui/PageHeader';
import GlassInput from '../../components/ui/GlassInput';
import GlassSelectCustom from '../../components/ui/GlassSelectCustom';
import Icon from '../../components/ui/Icon';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { useTemplates, useTemplateCategories, useTrackTemplateUsage } from '../../services/queries';
import SEO from '../../components/SEO';
import { format } from 'date-fns';

export default function Templates() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Build query params
  const queryParams = useMemo(() => {
    const params = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    };
    if (categoryFilter) {
      params.category = categoryFilter;
    }
    if (searchQuery) {
      params.search = searchQuery;
    }
    return params;
  }, [categoryFilter, searchQuery, currentPage]);

  const { data: templatesData, isLoading, error } = useTemplates(queryParams);
  const { data: categoriesData } = useTemplateCategories();
  const trackUsage = useTrackTemplateUsage();

  // Normalize response structure
  const responseData = templatesData?.data || templatesData || {};
  const templates = responseData.templates || responseData.items || [];
  const pagination = responseData.pagination || {};
  const categories = categoriesData?.data || categoriesData || [];

  // Reset to page 1 when filters change
  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleUseTemplate = async (template) => {
    try {
      // Track template usage
      if (template.id) {
        await trackUsage.mutateAsync(template.id);
      }
      
      // Navigate to campaign create with template pre-filled
      navigate('/app/campaigns/new', {
        state: {
          template: {
            message: template.content,
            name: template.title,
          },
        },
      });
    } catch (error) {
      // Error already handled by toast.error above
      // Still navigate even if tracking fails
      navigate('/app/campaigns/new', {
        state: {
          template: {
            message: template.content,
            name: template.title,
          },
        },
      });
    }
  };

  // Check if we have any data
  const hasData = templates && templates.length > 0;
  const isInitialLoad = isLoading && !templatesData;

  if (isInitialLoad) {
    return <LoadingState size="lg" message="Loading templates..." />;
  }

  return (
    <>
      <SEO
        title="Templates - Sendly SMS Marketing"
        description="Browse and use SMS message templates"
        path="/app/templates"
      />
      <div className="min-h-screen pt-4 sm:pt-6 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-neutral-bg-base w-full max-w-full">
        <div className="max-w-[1400px] mx-auto w-full">
          {/* Header */}
          <PageHeader
            title="Templates"
            subtitle="Browse and use pre-built SMS message templates"
          />

          {/* Error State */}
          {error && (
            <ErrorState
              title="Error Loading Templates"
              message={error.message || 'Failed to load templates. Please try refreshing the page.'}
              onAction={() => window.location.reload()}
              actionLabel="Refresh Page"
            />
          )}

          {/* Filters */}
          {!error && (
            <GlassCard className="p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassInput
                  label="Search Templates"
                  type="text"
                  placeholder="Search by name or content..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                />
                <GlassSelectCustom
                  label="Filter by Category"
                  value={categoryFilter}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  options={[
                    { value: '', label: 'All Categories' },
                    ...categories
                      .filter(cat => cat) // Filter out null/undefined
                      .map((cat) => ({
                        value: cat,
                        label: cat,
                      })),
                  ]}
                />
              </div>

              {/* Results Summary */}
              {pagination.total !== undefined && (
                <div className="mt-4 pt-4 border-t border-neutral-border/60">
                  <p className="text-sm text-neutral-text-secondary">
                    Showing {templates.length} of {pagination.total || 0} template{pagination.total !== 1 ? 's' : ''}
                    {(categoryFilter || searchQuery) && (
                      <span className="ml-2">
                        {categoryFilter && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-ice-soft/60 border border-ice-primary/20 text-ice-primary text-xs font-medium">
                            {categoryFilter}
                            <button
                              onClick={() => handleCategoryChange('')}
                              className="hover:text-ice-primary/80 focus:outline-none"
                              aria-label="Remove category filter"
                            >
                              <Icon name="close" size="xs" />
                            </button>
                          </span>
                        )}
                        {searchQuery && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-ice-soft/60 border border-ice-primary/20 text-ice-primary text-xs font-medium ml-2">
                            "{searchQuery}"
                            <button
                              onClick={() => handleSearchChange('')}
                              className="hover:text-ice-primary/80 focus:outline-none"
                              aria-label="Clear search"
                            >
                              <Icon name="close" size="xs" />
                            </button>
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Templates Grid */}
          {!error && !hasData && (
            <EmptyState
              icon="templates"
              title="No templates found"
              message={
                searchQuery || categoryFilter
                  ? 'Try adjusting your filters to find more templates.'
                  : 'No templates available at the moment.'
              }
            />
          )}

          {!error && hasData && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {templates.map((template) => (
                  <GlassCard
                    key={template.id}
                    className="p-5 sm:p-6 hover:shadow-glass-light-lg transition-all duration-200 flex flex-col"
                  >
                    {/* Preview Image */}
                    {template.previewImage && (
                      <div className="mb-4 rounded-lg overflow-hidden bg-neutral-surface-secondary">
                        <img
                          src={template.previewImage}
                          alt={template.title || 'Template preview'}
                          className="w-full h-32 sm:h-40 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    {template.category && (
                      <div className="mb-3">
                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-ice-soft/60 border border-ice-primary/20 text-ice-primary font-medium">
                          {template.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-neutral-text-primary line-clamp-2">
                      {template.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-sm text-neutral-text-secondary line-clamp-3 mb-4 flex-grow">
                      {template.content}
                    </p>
                    
                    {/* Tags */}
                    {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {template.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs rounded-full bg-neutral-surface-secondary/50 border border-neutral-border/30 text-neutral-text-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-neutral-text-secondary">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Footer Info */}
                    <div className="flex items-center justify-between mb-4 pt-4 border-t border-neutral-border/60">
                      {template.useCount !== undefined && template.useCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-text-secondary">
                          <Icon name="check" size="xs" variant="ice" />
                          <span>Used {template.useCount} time{template.useCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {template.createdAt && (
                        <span className="text-xs text-neutral-text-secondary">
                          {format(new Date(template.createdAt), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>

                    {/* Use Template Button */}
                    <GlassButton
                      variant="primary"
                      size="md"
                      onClick={() => handleUseTemplate(template)}
                      className="w-full min-h-[44px]"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Icon name="campaign" size="sm" variant="ice" />
                        Use Template
                      </span>
                    </GlassButton>
                  </GlassCard>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <GlassCard className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-neutral-text-secondary">
                      Page {pagination.page || currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <GlassButton
                        variant="ghost"
                        size="md"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!pagination.hasPrevPage || currentPage === 1}
                        className="min-h-[44px] min-w-[44px]"
                        aria-label="Previous page"
                      >
                        <Icon name="arrowLeft" size="sm" variant="ice" />
                      </GlassButton>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <GlassButton
                              key={pageNum}
                              variant={currentPage === pageNum ? 'primary' : 'ghost'}
                              size="md"
                              onClick={() => setCurrentPage(pageNum)}
                              className="min-h-[44px] min-w-[44px]"
                              aria-label={`Go to page ${pageNum}`}
                              aria-current={currentPage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                            </GlassButton>
                          );
                        })}
                      </div>
                      <GlassButton
                        variant="ghost"
                        size="md"
                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={!pagination.hasNextPage || currentPage === pagination.totalPages}
                        className="min-h-[44px] min-w-[44px]"
                        aria-label="Next page"
                      >
                        <Icon name="arrowRight" size="sm" variant="ice" />
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
