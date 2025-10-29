"use client";
import { X, LogOut, HelpCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { setActivePanel } from "@/src/lib/features/ui/uiSlice";
import styles from "../layers/layers-panel.module.css";
import userStyles from "./user-profile-panel.module.css";

export default function UserProfilePanel() {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(setActivePanel(null));
  };

  const handleLogout = () => {
    // Potential logout logic
    console.log("User logged out");
    handleClose();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4>Profile</h4>
        <button onClick={handleClose} className={styles.closeButton}>
          <X size={20} />
        </button>
      </div>
      <hr className={styles.divider} />

      <div className={styles.content}>
        <div className={styles.section}>
          {/* profile details potentially here */}
          <p>Hello, User!</p>
        </div>

        <div className={styles.section}>
          <ul className={userStyles.menuList}>
            <li className={userStyles.menuItem}>
              <HelpCircle size={18} />
              <span>Help & Feedback</span>
            </li>
            <li
              className={`${userStyles.menuItem} ${userStyles.logout}`}
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
