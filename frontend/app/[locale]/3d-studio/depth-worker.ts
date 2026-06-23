import { pipeline, env, PipelineType } from "@huggingface/transformers";

// Disable local models, use remote models from huggingface hub
env.allowLocalModels = false;

// We use the singleton pattern to avoid instantiating the model multiple times
class DepthEstimationPipeline {
  static task: PipelineType = "depth-estimation";
  static model = "Xenova/depth-anything-small-hf";
  static instance: any = null;

  static async getInstance(progress_callback: any = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback: progress_callback || undefined,
      });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  const { action, image } = event.data;

  if (action === "estimate_depth") {
    try {
      // Send message to indicate we're starting
      self.postMessage({ status: "init" });

      // Get pipeline instance (this will download weights the first time)
      const estimator = await DepthEstimationPipeline.getInstance((x: any) => {
        self.postMessage({ status: "progress", progress: x });
      });

      self.postMessage({ status: "processing" });

      // Predict the depth map
      const output = await estimator(image);
      
      // Output contains the depth image
      self.postMessage({
        status: "complete",
        depthData: output.depth.data,
        width: output.depth.width,
        height: output.depth.height,
        channels: output.depth.channels,
      });
    } catch (error: any) {
      self.postMessage({ status: "error", error: error.message });
    }
  }
});
