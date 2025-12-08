"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Notification.module.css";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type,
  onClose,
  duration = 5000,
}: NotificationProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    
    const notification = notificationRef.current;
    if (notification) {
      setTimeout(() => {
        const handleAnimationEnd = () => {
          onClose();
        };
        notification.addEventListener('animationend', handleAnimationEnd, { once: true });
      }, 10);
    } else {
      setTimeout(() => onClose(), 300);
    }
  };

  useEffect(() => {
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const handleAnimationEnd = () => {
      handleClose();
    };

    progressBar.addEventListener('animationend', handleAnimationEnd);

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      progressBar.removeEventListener('animationend', handleAnimationEnd);
      clearTimeout(timer);
    };
  }, [duration]);

  return (
    <div 
      ref={notificationRef}
      className={`${styles.notification} ${styles[type]} ${isClosing ? styles.closing : ''}`}
      style={{ '--duration': `${duration}ms` } as React.CSSProperties}
    >
      <div className={styles.content}>
        <span className={styles.icon}>
          {type === "success" && "✓"}
          {type === "error" && "✕"}
          {type === "warning" && "!"}
          {type === "info" && "ℹ"}
        </span>
        <span className={styles.message}>{message}</span>
        <button className={styles.closeButton} onClick={handleClose}>
          ×
        </button>
      </div>
      <div ref={progressBarRef} className={styles.progressBar}></div>
    </div>
  );
}

