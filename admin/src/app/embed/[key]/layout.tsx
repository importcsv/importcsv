/**
 * Layout for embed pages.
 *
 * This is a minimal layout without the dashboard navigation, PostHog,
 * HelpScout, or other dashboard-specific components. The embed page
 * is designed to be loaded in an iframe on customer sites.
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
