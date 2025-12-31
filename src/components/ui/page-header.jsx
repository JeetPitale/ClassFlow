







export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="section-title">{title}</h1>
        {description && <p className="section-subtitle mb-0">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>);

}