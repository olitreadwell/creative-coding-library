import { AppDetail } from "@/components/app-detail";
import { PredictPrompt } from "@/components/learning/PredictPrompt";
import { RecallCheck } from "@/components/learning/RecallCheck";
import { meta } from "./app.meta";
import Overview from "./overview.mdx";
import Tutorial from "./tutorial.mdx";

export const metadata = {
  title: `${meta.title} — creative-coding-library`,
  description: meta.description,
};

export default function WebcamMirrorDetailPage() {
  return (
    <AppDetail
      meta={meta}
      synopsis={<Overview />}
      tutorial={<Tutorial />}
      predict={meta.predictPrompt ? <PredictPrompt prompt={meta.predictPrompt} /> : undefined}
      recall={
        meta.recallChecks && meta.recallChecks.length > 0 ? (
          <RecallCheck checks={meta.recallChecks} />
        ) : undefined
      }
    />
  );
}
