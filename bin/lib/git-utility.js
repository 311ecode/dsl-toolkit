const {join} = require('path')
const arrayDsl = require('array-dsl')
module.exports = (directory) => {
    const s = require('shelljs')
    s.cd(directory);

    const ex = {
        sexec: (command, config = {silent:false}) => s.exec(command, {silent:true, ...config}),
        removeEmptyLines: (output) => output.split('\n').filter(e=>e!=='').join(' '),
        exec: (command) => ex.removeEmptyLines(ex.sexec(command).stdout),
        stash: () => ex.exec('git stash'),
        getCurrentBranch: () => ex.exec('git branch  | grep "*" | awk \'{print $2}\''),
        getAllBranches: () => ex.exec('git branch -a').split(' ').filter(e=>e!=='*'&&e!==''&&e!=='->'),
        getAllBranchesWithoutRemotes: () => arrayDsl(ex.exec('git branch -a').split(' ')
            .filter(e=>e!=='*'&&e!==''&&e!=='->').map(e=>e.startsWith('remotes/') ? e.split('/')
                .slice(2).join('/') : e)).unique()
            .filter(e=>!e.startsWith('circleci') && !e.startsWith('greenkeeper')&&!e.startsWith('origin')&&e!== 'HEAD'),
        getAllRemoteBranches: () => ex.getAllBranches().filter(e=>e.startsWith('remotes/')),
        getAllRemotes: () => ex.getAllRemoteBranches().map(e=>e.split('/')[1])
            .filter((v, i, a) => a.indexOf(v) === i),
        checkoutBranch: name => ex.sexec(`git checkout ${name}`),
        filterBranch:(directory, branch) => ex.sexec(`git filter-branch --force --prune-empty --subdirectory-filter ${directory}/ ${branch}`, {silent:false}),
        createBranch: name => ex.exec(`git checkout -b ${name}`),
        getDirectory: () => directory,
        addRemote: packageName => ex.sexec(`git remote add ${packageName} git@github.com:dsl-toolkit/${packageName}.git`),
        subDirectoryToSeparateBranch: (currentBranch, packageDirecroty) => {
            const packageName = require(join(__dirname, '../..', packageDirecroty, 'package.json')).name
            const newBranch = `${currentBranch}_${packageName}`
            ex.createBranch(newBranch)
            ex.filterBranch(packageDirecroty, newBranch)
            ex.addRemote(packageName)
            ex.sexec(`git push -f ${packageName} ${newBranch}:${currentBranch}`)
            ex.checkoutBranch(currentBranch)
        },
    }

    return ex
}


