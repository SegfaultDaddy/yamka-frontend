"use client";
import { useState } from "react";
import {
  X,
  LogOut,
  HelpCircle,
  User,
  Camera,
  ArrowLeft,
  Mail,
  Lock,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { setActivePanel } from "@/src/lib/features/ui/uiSlice";
import { useRouter } from "next/navigation";
import styles from "../layers/layers-panel.module.css";
import userStyles from "./user-profile-panel.module.css";
import Image from "next/image";

export default function UserProfilePanel() {
  const dispatch = useDispatch();
  const router = useRouter();

  // const user = { name: "John Doe", email: "john@example.com", image: null };
  const user = null;

  const [isEditing, setIsEditing] = useState(false);

  // handlers
  const handleClose = () => dispatch(setActivePanel(null));

  const handleLogout = () => {
    console.log("User logged out");
    // dispatch(logoutAction());
    handleClose();
  };

  const handleAuthNavigate = (path) => {
    router.push(path);
    handleClose();
  };

  const handleEditSubmit = () => {
    console.log("edit was successfully submitted");
  };

  const handleAvatarEdit = () => {
    console.log("edit avatar");
  };

  // guest view:
  if (!user) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <h4>Account</h4>
          <button onClick={handleClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <hr className={styles.divider} />

        <div className={styles.content}>
          <div className={userStyles.guestContainer}>
            <div className={userStyles.guestIcon}>
              <User size={48} />
            </div>
            <p className={userStyles.guestText}>
              Log in to save your progress and access profile settings.
            </p>

            <div className={userStyles.authButtons}>
              <button
                className={userStyles.btnPrimary}
                onClick={() => handleAuthNavigate("/sign-in")}
              >
                Sign In
              </button>
              <button
                className={userStyles.btnSecondary}
                onClick={() => handleAuthNavigate("/sign-up")}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // edit mode
  if (isEditing) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <button
            onClick={() => setIsEditing(false)}
            className={userStyles.backButton}
          >
            <ArrowLeft size={20} />
          </button>
          <h4>Edit Profile</h4>
          <div style={{ width: 20 }} />
        </div>
        <hr className={styles.divider} />

        <div className={styles.content}>
          <form
            className={userStyles.editForm}
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Avatar Edit */}
            <div className={userStyles.avatarEditWrapper}>
              <div className={userStyles.avatarLarge}>
                {user.image ? (
                  <Image src={user.image} alt="avatar" />
                ) : (
                  <User size={40} />
                )}
              </div>
              <button
                onClick={handleAvatarEdit}
                className={userStyles.cameraButton}
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Inputs */}
            <div className={userStyles.inputGroup}>
              <label>Display Name</label>
              <input type="text" defaultValue={user.name} />
            </div>

            <div className={userStyles.inputGroup}>
              <label>Email</label>
              <div className={userStyles.inputWithIcon}>
                <Mail size={16} />
                <input type="email" defaultValue={user.email} />
              </div>
            </div>

            <div className={userStyles.inputGroup}>
              <label>New Password</label>
              <div className={userStyles.inputWithIcon}>
                <Lock size={16} />
                <input type="password" placeholder="••••••••" />
              </div>
            </div>

            <button
              onClick={handleEditSubmit}
              className={userStyles.btnPrimary}
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Signed in
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
        {/* Profile Header */}
        <div className={userStyles.profileHeader}>
          <div className={userStyles.avatar}>
            {user.image ? (
              <Image src={user.image} alt="avatar" className={userStyles.pfp} />
            ) : (
              <User size={32} />
            )}
          </div>
          <div className={userStyles.profileInfo}>
            <span className={userStyles.userName}>{user.name}</span>
            <span className={userStyles.userEmail}>{user.email}</span>
          </div>
        </div>

        {/* Edit Button*/}
        <button
          className={userStyles.editTriggerBtn}
          onClick={() => setIsEditing(true)}
        >
          Edit Profile
        </button>

        <div className={styles.section}>
          <ul className={userStyles.menuList}>
            <li
              className={userStyles.menuItem}
              onClick={() => router.push("/help")}
            >
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
