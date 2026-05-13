import {
  Children,
  createElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { describe, expect, it } from "vitest";
import { UserAvatar } from "~/components/ui/user-avatar";

type AvatarChildProps = {
  src?: string;
  alt?: string;
  children?: ReactNode;
};

function renderUserAvatar(
  props: Partial<ComponentProps<typeof UserAvatar>> = {},
) {
  return createElement(UserAvatar, {
    name: "Test User",
    ...props,
  });
}

function getAvatarChildren(
  element: ReactElement<ComponentProps<typeof UserAvatar>>,
) {
  const rendered = UserAvatar(element.props) as ReactElement<{
    children?: ReactNode;
  }>;

  return Children.toArray(rendered.props.children).filter(
    (child): child is ReactElement<AvatarChildProps> => isValidElement(child),
  );
}

describe("UserAvatar", () => {
  it("renders remote OAuth avatars with their original source URL", () => {
    const children = getAvatarChildren(
      renderUserAvatar({
        src: "https://lh3.googleusercontent.com/a/example=s96-c",
        alt: "Google User",
      }),
    );

    expect(children).toHaveLength(2);
    expect(children[0]?.props).toMatchObject({
      src: "https://lh3.googleusercontent.com/a/example=s96-c",
      alt: "Google User",
    });
  });

  it("renders uploaded custom avatars with their original source URL", () => {
    const children = getAvatarChildren(
      renderUserAvatar({
        src: "https://utfs.io/f/profile-avatar.png",
        alt: "Uploaded User",
      }),
    );

    expect(children).toHaveLength(2);
    expect(children[0]?.props).toMatchObject({
      src: "https://utfs.io/f/profile-avatar.png",
      alt: "Uploaded User",
    });
  });

  it("falls back to initials when no avatar source is present", () => {
    const children = getAvatarChildren(
      renderUserAvatar({
        src: null,
        name: "Missing Person",
      }),
    );

    expect(children).toHaveLength(1);
    expect(children[0]?.props.children).toBe("MP");
  });
});
