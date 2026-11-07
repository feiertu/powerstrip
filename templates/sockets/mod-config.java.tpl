package {{meta.group}}.config;

import net.minecraftforge.common.ForgeConfigSpec;

public class {{params.configClassName}} {
    public static final ForgeConfigSpec.Builder BUILDER = new ForgeConfigSpec.Builder();
    public static final ForgeConfigSpec SPEC;

    {{#each params.entries}}
    public static final ForgeConfigSpec.{{typeName}} {{field}} =
            BUILDER{{#if comment}}.comment("{{comment}}"){{/if}}.{{#if isBool}}define{{else}}defineInRange{{/if}}("{{key}}", {{#if isBool}}{{defaultText}}{{else}}{{defaultText}}, {{min}}, {{max}}{{/if}});
    {{/each}}

    static {
        SPEC = BUILDER.build();
    }
}
