# Loop through all stashes
for stash_ref in $(git stash list | awk -F: '{print $1}'); do
    echo "Processing $stash_ref..."

    # Get all files in the stash
    files=$(git stash show --name-only $stash_ref)

    for file in $files; do
        # Create directories for the file structure
        mkdir -p conflict_backup/$stash_ref/$(dirname $file)

        # Extract HEAD version
        git show $stash_ref^1:$file > conflict_backup/$stash_ref/${file}_HEAD 2>/dev/null || echo "No HEAD version for $file"

        # Extract INDEX version
        git show $stash_ref^2:$file > conflict_backup/$stash_ref/${file}_INDEX 2>/dev/null || echo "No INDEX version for $file"  

        # Extract WORKTREE version
        git show $stash_ref:$file > conflict_backup/$stash_ref/${file}_WORKTREE 2>/dev/null || echo "No WORKTREE version for $file"
    done
done

echo "Backup complete. Check the 'conflict_backup' folder."
