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
  Trash2,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { setActivePanel } from "@/src/lib/features/ui/uiSlice";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  deleteUserAccount,
  updateUserProfile,
} from "@/src/lib/actions/user.actions";

import styles from "../layers/layers-panel.module.css";
import userStyles from "./user-profile-panel.module.css";
import Image from "next/image";

export default function UserProfilePanel() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { data: session, update } = useSession();
  const user = session?.user;

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // handlers
  const handleClose = () => dispatch(setActivePanel(null));

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    dispatch(setActivePanel(null));
  };

  const handleAuthNavigate = (path) => {
    router.push(path);
    handleClose();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (confirmed) {
      const result = await deleteUserAccount();
      if (result.success) {
        await signOut({ callbackUrl: "/" });
        dispatch(setActivePanel(null));
      } else {
        alert(result.message);
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    const result = await updateUserProfile(formData);

    if (result.success) {
      const newName = formData.get("name");
      const newEmail = formData.get("email");

      await update({
        ...session,
        user: {
          ...session?.user,
          name: newName,
          email: newEmail,
        },
      });

      setIsEditing(false);
      router.refresh();
    } else {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        alert(result.message);
      }
    }
  };

  const handleAvatarEdit = () => {
    console.log("Avatar edit not implemented yet");
  };

  // guest view
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
          <form className={userStyles.editForm} onSubmit={handleEditSubmit}>
            {/* pfp */}
            <div className={userStyles.avatarEditWrapper}>
              <div className={userStyles.avatarLarge}>
                {user.image ? (
                  <Image
                    src={user.image}
                    alt="avatar"
                    width={80}
                    height={80}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <User size={40} />
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarEdit}
                className={userStyles.cameraButton}
              >
                <Camera size={16} />
              </button>
            </div>

            <div className={userStyles.inputGroup}>
              <label>Display Name</label>
              <input
                type="text"
                defaultValue={user.name || ""}
                name="name"
                autoComplete="name"
                style={errors.name ? { borderColor: "red" } : {}}
              />
              {errors.name && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.name[0]}
                </p>
              )}
            </div>

            <div className={userStyles.inputGroup}>
              <label>Email</label>
              <div className={userStyles.inputWithIcon}>
                <Mail size={16} />
                <input
                  type="email"
                  name="email"
                  defaultValue={user.email || ""}
                  autoComplete="email"
                  style={errors.email ? { borderColor: "red" } : {}}
                />
              </div>
              {errors.email && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.email[0]}
                </p>
              )}
            </div>

            <div className={userStyles.inputGroup}>
              <label>New Password (Optional)</label>
              <div className={userStyles.inputWithIcon}>
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  autoComplete="new-password"
                  style={errors.password ? { borderColor: "red" } : {}}
                />
              </div>
              {errors.password && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.password[0]}
                </p>
              )}
            </div>

            <div className={userStyles.inputGroup}>
              <label>Confirm New Password</label>
              <div className={userStyles.inputWithIcon}>
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  name="confirmNewPassword"
                  autoComplete="new-password"
                  style={
                    errors.confirmNewPassword ? { borderColor: "red" } : {}
                  }
                />
              </div>
              {errors.confirmNewPassword && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.confirmNewPassword[0]}
                </p>
              )}
            </div>

            <hr className={styles.divider} style={{ margin: "0" }} />

            <div className={userStyles.inputGroup}>
              <label>Current Password</label>
              <div className={userStyles.inputWithIcon}>
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="Enter current password"
                  name="currentPassword"
                  autoComplete="current-password"
                  style={errors.currentPassword ? { borderColor: "red" } : {}}
                />
              </div>
              {errors.currentPassword && (
                <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {errors.currentPassword[0]}
                </p>
              )}
            </div>

            <button type="submit" className={userStyles.btnPrimary}>
              Save Changes
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className={userStyles.btnSecondary}
              style={{
                color: "#ef4444",
                borderColor: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  // signed in
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
        <div className={userStyles.profileHeader}>
          <div className={userStyles.avatar}>
            {user.image ? (
              <Image
                src={user.image}
                alt="avatar"
                width={64}
                height={64}
                className={userStyles.pfp}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <User size={32} />
            )}
          </div>
          <div className={userStyles.profileInfo}>
            <span className={userStyles.userName}>{user.name}</span>
            <span className={userStyles.userEmail}>{user.email}</span>
          </div>
        </div>

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
