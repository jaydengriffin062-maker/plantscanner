/** Centered icon + message block for empty and error states. `tone`: default | warning | danger. */
export default function EmptyState({ icon: Icon, title, message, tone = 'default', children }) {
  return (
    <div className={`empty empty--${tone}`}>
      {Icon && (
        <span className="empty__icon">
          <Icon size={30} aria-hidden />
        </span>
      )}
      <h2 className="empty__title">{title}</h2>
      {message && <p className="empty__message">{message}</p>}
      {children && <div className="empty__actions">{children}</div>}
    </div>
  );
}
