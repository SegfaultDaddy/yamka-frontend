import styles from "./nav-item.module.css";

export default function NavItem({ icon: Icon, title, onClick, isActive }) {
  const navItemClasses = `
    ${styles.navItem}
    ${isActive ? styles.active : ""}
  `;

  return (
    <button
      type="button"
      title={title}
      className={navItemClasses.trim()}
      onClick={onClick}
    >
      <Icon size={20} />
    </button>
  );
}
