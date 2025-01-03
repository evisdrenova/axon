import { Model } from "../types/index";

export const createProvider = (model: Model) => {
  const parts = model.name.split(":", 2);
  if (parts.length < 2) {
    throw new Error(
      `Invalid model format. Expected provider:model, got ${model.name}`
    );
  }

  const provider = parts[0];
  const modelVersion = parts[1];

  const a = Provider.createProvider(
    model.config.apikey,
    model.config.url,
    modelVersion
  );

  switch (provider) {
    case "anthropic":
      console.log("got anthropic");
      return Provider.createProvider(
        model.config.apikey,
        model.config.url,
        modelVersion
      );
    default:
      throw new Error(`unsupported provider, got:${provider}`);
  }
};
