/**
 * TEMPLATE — Topic registration.
 *
 * Bundles learn content and scenarios into a single `Topic`. Copy this whole
 * `_template/` directory to `src/topics/<your-topic>/`, rename the exports, and
 * fill in real content (see README.md for the four-step checklist).
 *
 * NOTE: This template ships `status: "coming-soon"` and NO `Playground`, so it
 * stays a safe, compiling stub. A real, shippable topic instead:
 *   1. sets `status: "available"`,
 *   2. adds an interactive `Playground` (e.g. `import Playground from "./Playground";`
 *      then `Playground,` below), and
 *   3. is registered in `src/app/topicRegistry.ts` so the shell can find it —
 *      this `_template` is intentionally NOT registered there.
 *
 * Pick `group` from the four buckets in `TopicGroup`:
 *   "discriminative" | "generative" | "language" | "clinical".
 */

import type { Topic } from "../../types/topic";
import { templateLearn } from "./content";
import { templateScenarios } from "./scenarios";

const templateTopic: Topic = {
  id: "template-example",
  group: "discriminative",
  title: "Template Example",
  status: "coming-soon",
  learn: templateLearn,
  scenarios: templateScenarios,
  // Playground,  // <- a real "available" topic adds its Playground FC here.
};

export default templateTopic;
