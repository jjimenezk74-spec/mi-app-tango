import TopNav from "./TopNav";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function MainLayout({ children, title, subtitle, actions }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="min-h-[calc(100vh-4rem)]">
        {/* Page Header */}
        {(title || actions) && (
          <header className="bg-background border-b border-border">
            <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
              <div>
                {title && (
                  <h1 className="text-2xl font-display font-bold text-foreground">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          </header>
        )}

        {/* Page Content */}
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
