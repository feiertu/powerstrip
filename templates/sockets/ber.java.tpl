package {{meta.group}}.block.entity.renderer;

import {{meta.group}}.block.entity.custom.{{params.beClassName}};
import com.mojang.blaze3d.vertex.PoseStack;
import net.minecraft.client.Minecraft;
import net.minecraft.client.renderer.LightTexture;
import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.blockentity.BlockEntityRenderer;
import net.minecraft.client.renderer.blockentity.BlockEntityRendererProvider;
import net.minecraft.client.renderer.entity.ItemRenderer;
import net.minecraft.core.BlockPos;
import net.minecraft.world.item.ItemDisplayContext;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.LightLayer;

public class {{params.rendererClassName}} implements BlockEntityRenderer<{{params.beClassName}}> {
    public {{params.rendererClassName}}(BlockEntityRendererProvider.Context context) {
    }

    @Override
    public void render({{params.beClassName}} pBlockEntity, float pPartialTick, PoseStack pPoseStack,
                       MultiBufferSource pBufferSource, int pPackedLight, int pPackedOverlay) {
        ItemStack itemStack = pBlockEntity.getRenderStack();
        ItemStack itemStack1 = pBlockEntity.getRenderStack1();
        ItemStack itemStack2 = pBlockEntity.getRenderStack2();

        Minecraft minecraft = Minecraft.getInstance();
        ItemRenderer itemRenderer = minecraft.getItemRenderer();
        if (!itemStack.isEmpty()) {
            pPoseStack.pushPose();
            pPoseStack.scale(0.5f, 0.5f, 0.5f);
            pPoseStack.translate(0.5f, 1.55f, 0.5f);

            itemRenderer.renderStatic(itemStack, ItemDisplayContext.FIXED, getLightLevel(pBlockEntity.getLevel(),
                            pBlockEntity.getBlockPos()), pPackedOverlay, pPoseStack, pBufferSource, pBlockEntity.getLevel(), 1);
            pPoseStack.popPose();
        }
        if (!itemStack1.isEmpty()) {
            pPoseStack.pushPose();
            pPoseStack.scale(0.25f, 0.25f, 0.25f);
            pPoseStack.translate(1.15f, 2.65f, 1.15f);

            itemRenderer.renderStatic(itemStack1, ItemDisplayContext.FIXED, getLightLevel(pBlockEntity.getLevel(),
                            pBlockEntity.getBlockPos()), pPackedOverlay, pPoseStack, pBufferSource, pBlockEntity.getLevel(), 1);
            pPoseStack.popPose();
        }
        if (!itemStack2.isEmpty()) {
            pPoseStack.pushPose();
            pPoseStack.scale(0.25f, 0.25f, 0.25f);
            pPoseStack.translate(2.9f, 2.6f, 1.15f);

            itemRenderer.renderStatic(itemStack2, ItemDisplayContext.FIXED, getLightLevel(pBlockEntity.getLevel(),
                            pBlockEntity.getBlockPos()), pPackedOverlay, pPoseStack, pBufferSource, pBlockEntity.getLevel(), 1);
            pPoseStack.popPose();
        }
    }

    private int getLightLevel(Level level, BlockPos pos) {
        int bLight = level.getBrightness(LightLayer.BLOCK, pos);
        int sLight = level.getBrightness(LightLayer.SKY, pos);
        return LightTexture.pack(bLight, sLight);
    }
}
