package {{meta.group}}.entity.client;

import net.minecraft.client.renderer.entity.BoatRenderer;
import net.minecraft.client.renderer.entity.EntityRendererProvider;

public class {{params.rendererClassName}} extends BoatRenderer {
    public {{params.rendererClassName}}(EntityRendererProvider.Context pContext) {
        super(pContext);
    }
}
