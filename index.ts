import Filehound from "filehound"
import keys from "lodash.keys"
import keyBy from "lodash.keyby"
import { RecipeBuilder, paths } from "blitz/installer"
import { sep as filePathSeparator } from "path"
import { flatten, unflatten } from "flat"

const pluginConfig = {
    importOrder: () => {
        // Directories to discard.
        const discardNodeModules = "node_modules"
        const discardPrismaDatabaseMigrations = "db.*migrations.*\\d.*$"

        // Derive importOrder configuration from project directory structure.
        const directoryStructure = Filehound.create()
            .path(".")
            .discard([discardNodeModules, discardPrismaDatabaseMigrations])
            .ignoreHiddenDirectories()
            .ignoreHiddenFiles()
            .directory()
            .findSync()

        // Extract subdirectories.
        // See: https://github.com/custom-recipes/prettier-imports/issues/1
        const subDirectories = keys(
            flatten(
                unflatten(keyBy(directoryStructure), {
                    object: true,
                    overwrite: true,
                    delimiter: filePathSeparator,
                })
            )
        )

        // See: https://github.com/trivago/prettier-plugin-sort-imports#importorder
        const optionConfig = subDirectories.map((filePath) => `^${filePath.split(".").join("/")}/(.*)$`)
        
        // Relative path imports
        // See: https://github.com/trivago/prettier-plugin-sort-imports#usage
        optionConfig.push("^[./]");

        return optionConfig
    },
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    importOrderGroupNamespaceSpecifiers: true,
}

export default RecipeBuilder()
    .setName("Prettier Imports")
    .setDescription("This will install all necessary dependencies and configure the Prettier plugin '@trivago/prettier-plugin-sort-imports' for use.")
    .setOwner("Stefan Kühnel <git@stefankuehnel.com>")
    .setRepoLink("https://github.com/custom-recipes/prettier-imports")
    .addAddDependenciesStep({
        stepId: "addDeps",
        stepName: "Add npm dependencies",
        explanation: "We'll install the Prettier plugin itself.",
        packages: [
            {
                name: "@trivago/prettier-plugin-sort-imports",
                version: "latest",
                isDevDep: true
            }
        ]
    })
    .addTransformFilesStep({
        stepId: "configurePrettierPlugin",
        stepName: "Configure Prettier plugin",
        explanation: "Next, we'll configure the prettier plugin based on your directory structure.",
        singleFileSearch: paths.packageJson(),
        transformPlain(plainTextPackageJson: string) {
            const packageJson = JSON.parse(plainTextPackageJson);

            packageJson.prettier.importOrder = pluginConfig.importOrder();
            packageJson.prettier.importOrderSeparation = pluginConfig.importOrderSeparation;
            packageJson.prettier.importOrderSortSpecifiers = pluginConfig.importOrderSortSpecifiers;
            packageJson.prettier.importOrderGroupNamespaceSpecifiers = pluginConfig.importOrderGroupNamespaceSpecifiers;

            return JSON.stringify(packageJson, null, 2);
        }
    })
    .build()
