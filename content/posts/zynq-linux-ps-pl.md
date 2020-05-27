---
title: "PS-PL communication with Linux on Zynq"
author: "Noah Hütter"
layout: post
date: "2019-10-07"
tags: ["Linux", "FPGA","Redpitaya"]
category: ["zynq","zynq_linux"]
image: "img/pitaya/pitaya-alpine.png"
jumbo: "img/pitaya/pitaya-head-alpine.png"
description: "After building the Linux Kernel [in a recent post](/posts/pitaya-linux) we will run Alpine Linux as a leight weight distribution on the Zynq SoC"
draft: true
---


## GPIO
As a first example, we place a AXI GPIO block on the block design. 
Running connection automation enables the GP0 port on the Zynq PS as master interface
and connects the GPIO block. The redpitaya has no reset input (TODO: verify) so assign
a constant `1` to the `ext_rst_in` port of the reset generator.
Manually connecting the GPIO output with the LEDs and we  have the first simple AXI GPIO design. 

**BD IMG HERE**

Run synthesis, implementation and generate hardware export by running
```bash
make hw-export
```

Because I have built the linux kernel before the modification, it can be observed what changes 
from a new hardware export. Deriving from the linux Makefile we see that the fsbl has to be
regenerated after a hardware definition change. Trigger a fsbl build by running
```bash
make fsbl
```

Now we can repack the boot binary `boot.bin` containing the fsbl, bitstream and uboot boot loader.
```bash
make build/boot.bin
```

Another target depends on the hardware definition file, and this is where it gets interesting: 
The devicetree. Generate the device tree sources by running:
```bash
make dts
```

The file `build/bare.tree/system-top.dts` is the top device tree source file. Its content is 
mearly empty but we see thre include statements. Following the include `pl.dsi` we find our 
recently placed GPIO block. Comparing the address (`0x4120_0000` in my case) with the automatically
assigned address in Vivado HLx confirms the correct mapping.
```dtsi
/ {
  amba_pl: amba_pl {
    #address-cells = <1>;
    #size-cells = <1>;
    compatible = "simple-bus";
    ranges ;
    axi_gpio_0: gpio@41200000 {
      #gpio-cells = <3>;
      clock-names = "s_axi_aclk";
      clocks = <&misc_clk_0>;
      compatible = "xlnx,xps-gpio-1.00.a";
      gpio-controller ;
      reg = <0x41200000 0x10000>;
      xlnx,all-inputs = <0x0>;
      xlnx,all-inputs-2 = <0x0>;
      xlnx,all-outputs = <0x1>;
      xlnx,all-outputs-2 = <0x0>;
      xlnx,dout-default = <0x00000000>;
      xlnx,dout-default-2 = <0x00000000>;
      xlnx,gpio-width = <0x8>;
      xlnx,gpio2-width = <0x20>;
      xlnx,interrupt-present = <0x0>;
      xlnx,is-dual = <0x0>;
      xlnx,tri-default = <0xFFFFFFFF>;
      xlnx,tri-default-2 = <0xFFFFFFFF>;
    };
    misc_clk_0: misc_clk_0 {
      #clock-cells = <0>;
      clock-frequency = <125000000>;
      compatible = "fixed-clock";
    };
  };
};
```

From the device tree sources we can compile a device tree blob. This requires the Linux kernel
to be built. The device tree mechanism allows changes in hardware without having to rebuild
the whole kernel.
```bash
make dtb
```

Replace the `devicetree.dtb` file on the SD Card with the newly generated device tree blob as well
as the `boot.bin` with the new FSBL and bitstream. 

While the board is booting we will investigate more into the Xilinx GPIO driver. Located at
`linux-4.14/drivers/gpio/gpio-xilinx.c` we find the driver implementation for the axi gpio core. 
According to the [Driver Documentation][driver-doc]  *It does provide access to the GPIO by user space through the sysfs filesystem.*

[driver-doc]: https://xilinx-wiki.atlassian.net/wiki/spaces/A/pages/18841846/AXI+GPIO

Taking a look into the `/sys/class/gpio` we see out module:
```bash
ls -l /sys/class/gpio/
export
gpiochip898 -> ../../devices/soc0/amba_pl/41200000.gpio/gpio/gpiochip898
gpiochip906 -> ../../devices/soc0/amba/e000a000.gpio/gpio/gpiochip906
unexport
```

In this case, `gpio898` points to the axi apio located at `4120_0000`. To output a value
 we have to export it and write to it.
 ```bash
echo 898 > /sys/class/gpio/export 
echo out > /sys/class/gpio/gpio898/direction 
echo 1 > /sys/class/gpio/gpio898/value 
echo 898 > /sys/class/gpio/unexport 
 ```

## Access through /dev/mem



