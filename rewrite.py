def commit_callback(commit):
    if commit.author_email == b"198982749+Copilot@users.noreply.github.com":
        commit.author_name = b"ERZA"
        commit.author_email = b"eq73339@ubt-uni.net"
        commit.committer_name = b"ERZA"
        commit.committer_email = b"eq73339@ubt-uni.net"
