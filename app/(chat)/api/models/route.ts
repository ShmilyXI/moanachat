import {
  getAllGatewayModels,
  getCapabilities,
  getCapabilitiesForModels,
  isDemo,
} from "@/lib/ai/models";
import {
  fetchNewApiModels,
  filterRuntimeModels,
  getRuntimeDefaultModel,
} from "@/lib/ai/newapi";
import { getRuntimeConfig } from "@/lib/ai/runtime-config";

export async function GET() {
  const gatewayHeaders = {
    "Cache-Control": "private, no-store",
  };

  const runtimeConfig = await getRuntimeConfig();
  if (runtimeConfig.mode === "embedded") {
    const discoveredModels = await fetchNewApiModels(runtimeConfig);
    const models = filterRuntimeModels(
      discoveredModels,
      runtimeConfig.enabledModelIds
    );
    if (discoveredModels.length === 0 || models.length === 0) {
      return Response.json(
        { code: "offline:chat", error: "new_api_models_unavailable" },
        {
          headers: { "Cache-Control": "private, no-store" },
          status: 502,
        }
      );
    }

    return Response.json(
      {
        capabilities: getCapabilitiesForModels(models),
        defaultModelId: getRuntimeDefaultModel(
          models,
          runtimeConfig.defaultModelId
        ),
        mode: "embedded",
        models,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const curatedCapabilities = await getCapabilities();

  if (isDemo) {
    const models = await getAllGatewayModels();
    const capabilities = Object.fromEntries(
      models.map((m) => [m.id, curatedCapabilities[m.id] ?? m.capabilities])
    );

    return Response.json({ capabilities, models }, { headers: gatewayHeaders });
  }

  return Response.json(curatedCapabilities, { headers: gatewayHeaders });
}
