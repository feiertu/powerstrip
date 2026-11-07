package {{meta.group}}.entity.animations;

import software.bernie.geckolib.animation.RawAnimation;

public class ModAnimationDefinitions {
    {{#each hubs.ModAnimationDefinitions.entries}}
    public static final RawAnimation {{regField}} = RawAnimation.begin().thenLoop("animation.{{animName}}");
    {{/each}}
}
