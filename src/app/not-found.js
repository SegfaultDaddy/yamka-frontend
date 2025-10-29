"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/src/lib/constants";
import styles from "./not-found.module.css";

export default function NotFoundPage() {
  const router = useRouter();

  const goToHome = () => {
    router.push("/");
  };

  return (
    <div className={styles.container}>
      <Image
        src="/images/logo.svg"
        width={48}
        height={48}
        alt={`${APP_NAME || "App"} logo`}
        priority={true}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className={styles.card}>
        <h1 className={styles.title}>Not Found</h1>
        <p className={styles.text}>Could not find the requested page</p>
        <button className={styles.button} onClick={goToHome}>
          Back To Home
        </button>
      </div>
    </div>
  );
}
