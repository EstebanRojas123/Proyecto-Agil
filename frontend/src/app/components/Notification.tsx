"use client";
import { useEffect } from "react";
import styles from "./Notification.module.css";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type,
  onClose,
  duration = 5000,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          {type === "success" && "✓"}
          {type === "error" && "✕"}
          {type === "info" && "ℹ"}
        </span>
        <span className={styles.message}>{message}</span>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}

