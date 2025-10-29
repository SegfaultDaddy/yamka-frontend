import Image from "next/image";
import loader from "@/src/assets/loader.gif";

export default function LoadingPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Image
        src={loader}
        height={150}
        width={150}
        alt="Loading..."
        unoptimized
      />
    </div>
  );
}
