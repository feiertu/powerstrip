package {{meta.group}}.entity.client;

import {{meta.group}}.entity.custom.{{params.entityClassName}};
import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.resources.ResourceLocation;
import org.jetbrains.annotations.Nullable;
import software.bernie.geckolib.renderer.GeoEntityRenderer;

public class {{params.rendererClassName}} extends GeoEntityRenderer<{{params.entityClassName}}> {
    public {{params.rendererClassName}}(EntityRendererProvider.Context renderManager) {
        super(renderManager, new {{params.modelClassName}}());
    }

    @Override
    public RenderType getRenderType({{params.entityClassName}} animatable, ResourceLocation texture, @Nullable MultiBufferSource bufferSource, float partialTick) {
        return super.getRenderType(animatable, texture, bufferSource, partialTick);
    }
}
