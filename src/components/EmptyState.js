export default function EmptyState({ icon: Icon, title, message, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={56} className="empty__icon" aria-hidden />}
      <h2 className="empty__title">{title}</h2>
      {message && <p className="empty__message">{message}</p>}
      {children && <div className="empty__actions">{children}</div>}
    </div>
  );
}
