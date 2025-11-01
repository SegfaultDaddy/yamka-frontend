import { formatTitle } from "@/src/lib/utils/utils";
import styles from "./articlesSlug.module.css";

const fetchArticleBySlug = async (slug) => {
  const date = "October 31, 2025";

  const contentMap = {
    "getting-started": {
      title: `Getting Started with Yamka`,
      content: [
        "Welcome to Yamka! Our goal is to provide the most reliable real-time route optimization for your daily commute. This guide will help you set up your preferences.",
        "To begin, ensure location services are enabled on your device. Yamka works best when it can accurately track your position for live updates.",
      ],
    },
    "changing-layers": {
      title: "Changing Map Layers and Views",
      content: [
        "Yamka offers several map layers, including traffic flow, satellite and dark-mode view. You can switch between them easily.",
        "To customize your map view, click the 'Map Layers' button in the sidebar menu.",
        "Select your preffered style from the three available options under 'Map Styles'.",
      ],
    },
    "gps-accuracy-troubleshooting": {
      title: "Troubleshooting GPS Accuracy Issues",
      content: [
        "If you experience poor GPS accuracy, first ensure your device's operating system is up-to-date and that Yamka has maximum location permissions.",
        "Interference often occurs in dense urban areas or indoors. Try moving to an open space to re-establish a stable satellite lock.",
        "If the problem persists, try clearing the app cache via your device settings. If that fails, please send us a feedback report with your device model.",
      ],
    },
  };

  const article = contentMap[slug] || {
    title: formatTitle(slug) || "Article Not Found",
    content: [
      "The requested article could not be found. Please check the URL or return to the main articles page.",
    ],
  };

  return { ...article, date };
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  const description = article.content?.[0]
    ? article.content[0].substring(0, 150) + "..."
    : "Read a detailed help article on Yamka map features and troubleshooting.";

  return {
    title: `${article.title}`,
    description: description,
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  return (
    <div className={styles.articlePageContainer}>
      <h1 className={styles.articleTitle}>{article.title}</h1>
      <small className={styles.lastUpdated}>Last Updated: {article.date}</small>

      <div className={styles.articleContent}>
        {article.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
