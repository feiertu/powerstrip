package {{meta.group}}.entity.client;

import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.entity.animations.ModAnimationDefinitions;
import {{meta.group}}.entity.custom.{{params.entityClassName}};
import net.minecraft.client.model.geom.builders.CubeListBuilder;
import net.minecraft.client.model.geom.builders.LayerDefinition;
import net.minecraft.client.model.geom.builders.MeshDefinition;
import net.minecraft.client.model.geom.builders.PartDefinition;
import net.minecraft.client.model.geom.builders.PartPose;
import net.minecraft.resources.ResourceLocation;
import software.bernie.geckolib.core.animatable.GeoAnimatable;
import software.bernie.geckolib.core.animation.AnimatableManager;
import software.bernie.geckolib.core.animation.AnimationController;
import software.bernie.geckolib.core.animation.AnimationState;
import software.bernie.geckolib.core.animation.PlayState;
import software.bernie.geckolib.model.GeoModel;

public class {{params.modelClassName}} extends GeoModel<{{params.entityClassName}}> {
    @Override
    public ResourceLocation getModelResource({{params.entityClassName}} animatable) {
        return new ResourceLocation({{meta.mainClass}}.MOD_ID, "geo/{{params.modelPath}}.geo.json");
    }

    @Override
    public ResourceLocation getTextureResource({{params.entityClassName}} animatable) {
        return new ResourceLocation({{meta.mainClass}}.MOD_ID, "textures/entity/{{params.texturePath}}.png");
    }

    @Override
    public ResourceLocation getAnimationResource({{params.entityClassName}} animatable) {
        return new ResourceLocation({{meta.mainClass}}.MOD_ID, "animations/{{params.animationPath}}.animation.json");
    }

    @Override
    public void registerControllers(AnimatableManager.ControllerRegistrar controllers) {
        controllers.add(new AnimationController<>(this, "controller", 0, this::predicate));
    }

    private <T extends GeoAnimatable> PlayState predicate(AnimationState<T> state) {
        if (state.isMoving()) {
            state.getController().setAnimation(ModAnimationDefinitions.{{params.walkAnimField}});
            return PlayState.CONTINUE;
        }

        state.getController().setAnimation(ModAnimationDefinitions.{{params.idleAnimField}});
        return PlayState.CONTINUE;
    }

    public static LayerDefinition createBodyLayer() {
        MeshDefinition meshdefinition = new MeshDefinition();
        PartDefinition partdefinition = meshdefinition.getRoot();

        partdefinition.addOrReplaceChild("body", CubeListBuilder.create().texOffs(0, 0)
                        .addBox(-2.5f, -2f, -3f, 5f, 4f, 6f),
                PartPose.offset(0f, 24f, 0f));

        return LayerDefinition.create(meshdefinition, 32, 32);
    }
}
