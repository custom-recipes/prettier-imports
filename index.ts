import Filehound from "filehound"
import { RecipeBuilder, paths } from "@blitzjs/installer"
import { sep as pathSeparator } from "path"

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

        const optionConfig = directoryStructure.map((path) => {
            // Replace \\ or \ with / in path.
            const configPath = path.split(pathSeparator).join("/")

            // See: https://github.com/trivago/prettier-plugin-sort-imports#importorder
            return `^${configPath}/(.*)$`
        })

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
