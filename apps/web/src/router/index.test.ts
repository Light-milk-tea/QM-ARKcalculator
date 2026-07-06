import { describe, expect, it } from "vitest";
import { router } from "./index";

describe("router", () => {
  it("包含首页与全员榜单路由", () => {
    const routeNames = router.getRoutes().map((route) => route.name);
    expect(routeNames).toContain("home");
    expect(routeNames).toContain("skill-leaderboard");
  });
});
