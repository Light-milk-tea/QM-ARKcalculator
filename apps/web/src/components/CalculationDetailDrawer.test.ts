import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import CalculationDetailDrawer from "./CalculationDetailDrawer.vue";

describe("CalculationDetailDrawer", () => {
  it("open=false 时不渲染抽屉", () => {
    const wrapper = mount(CalculationDetailDrawer, {
      props: {
        open: false,
        row: null,
      },
      global: {
        stubs: {
          CalculationDetailSections: true,
        },
      },
    });
    expect(wrapper.find("aside").exists()).toBe(false);
  });
});
