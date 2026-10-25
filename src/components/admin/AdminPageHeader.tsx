import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header__copy">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="admin-page-header__title">{title}</h1>
        <p className="admin-page-header__description">{description}</p>
      </div>
      {actions ? (
        <div className="admin-page-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
