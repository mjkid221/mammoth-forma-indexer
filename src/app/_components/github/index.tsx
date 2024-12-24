import { Github, Twitter } from "lucide-react";
import { env } from "~/env";

export const GithubRepoLink = () => {
  return (
    <div className="flex items-center justify-end gap-4 text-muted-foreground">
      {env.NEXT_PUBLIC_CREATOR_NAME ? (
        <span className="text-sm">
          Created by {env.NEXT_PUBLIC_CREATOR_NAME}
        </span>
      ) : null}
      <div className="flex gap-2">
        {env.NEXT_PUBLIC_CREATOR_GITHUB_URL ? (
          <a
            href={env.NEXT_PUBLIC_CREATOR_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
        ) : null}
        {env.NEXT_PUBLIC_CREATOR_TWITTER_URL ? (
          <a
            href={env.NEXT_PUBLIC_CREATOR_TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            <Twitter className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
};
