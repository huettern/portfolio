---
title: "Alpine Linux on Zynq"
author: "Noah Hütter"
layout: post
date: "2019-05-08"
tags: ["Linux", "FPGA","Redpitaya"]
category: ["zynq","zynq_linux"]
image: "img/pitaya/pitaya-alpine.png"
jumbo: "img/pitaya/pitaya-head-alpine.png"
description: "After building the Linux Kernel [in a recent post](/posts/pitaya-linux) we will run Alpine Linux as a leight weight distribution on the Zynq SoC"
---

_Disclaimer: This code is largely copied from [https://github.com/pavel-demin/red-pitaya-notes](https://github.com/pavel-demin/red-pitaya-notes), licensed under MIT license._

## Prerequisites
This tutorial is built on top of the [Linux on Zynq](/posts/pitaya-linux) tutorial. 
It requires the Kernel built in the previous post. 
So if you want to get it working, start over at [Linux on Zynq](/posts/pitaya-linux) and come back here after you are done.

Clone my `zynq-sandbox` [repository](https://github.com/noah95/zynq-sandbox) from github.
```bash
git clone https://github.com/noah95/zynq-sandbox
```

Install `qemu` the CPU emulator.
```bash
sudo apt install qemu-user-static
```

Change to a suitable build folder.
```bash
mkdir -p sw/linux/build/alpine
cd sw/linux/build/alpine
```

## Build

## Download sources

We define the base url to pull the sources
```bash
alpine_url=http://dl-cdn.alpinelinux.org/alpine/v3.9
```

Next, download the sources:
```bash
# Alpine u-boot tar
alpine_tar=alpine-uboot-3.9.0-armv7.tar.gz
curl -o $alpine_tar -L $alpine_url/releases/armv7/$alpine_tar

# Tools
tools_tar=apk-tools-static-2.10.3-r1.apk
curl -o $tools_tar -L $alpine_url/main/armv7/$tools_tar

# Firmware
firmware_tar=linux-firmware-other-20190322-r0.apk
curl -o $firmware_tar -L $alpine_url/main/armv7/$firmware_tar
```

### Unpack

Now we unpack the downloaded sources:
```bash
# Alpine uboot
mkdir alpine-uboot
tar -zxf $alpine_tar --directory=alpine-uboot

# Alpine tools
mkdir alpine-tools
tar -zxf $tools_tar --directory=alpine-tools --warning=no-unknown-keyword
```

## Create initramfs

### Unzip the Alpine vanilla initramfs
Create a directory and change into it
```bash
mkdir alpine-initramfs
cd alpine-initramfs
```

Unzip the alpine initramfs vanilla image. 
The `gzip` commands decompresses (`-d`) and outputs on stdout (`-c`).
Gzip won't decompress if it does not know the file suffix, so the file is
copied to the current directory and then unpacked.
```bash
cp ../alpine-uboot/boot/initramfs-vanilla initramfs-vanilla.gz
gzip -dc initramfs-vanilla.gz | cpio -id
rm initramfs-vanilla.gz
```

### Remove unwanted stuff
Remove kernel module configurations
```bash
rm -rf etc/modprobe.d
```

Remove kernel firmware (binary drivers)
```bash
rm -rf lib/firmware
```

Remove kernel modules
```bash
rm -rf lib/modules
```

Remove cache
```bash
rm -rf var
```

### Repack initramfs
Now that the Alpine initramfs is cleaned up, we repack the initramfs.

 - `find .` lists all files in the current directory
 - `sort` sort files alphabetically
 - `cpio` Create new archive in the `newc` format
 - `gzip` compress the created archive

```bash
find . | sort | cpio --quiet -o -H newc | gzip -9 > ../initrd.gz
```

### Exit
```bash
cd ..
```

## Generate image for U-Boot
Now that we have packed the initramfs into a compressed archive, a bootimage is generated of U-Boot.

 - `-A arm` for arm architecture
 - `-T ramdisk` image type ramdisk
 - `-C gzip` compress image with gzip
 - `-d initrd.gz` use image data from initrd.gz

```bash
mkimage -A arm -T ramdisk -C gzip -d initrd.gz uInitrd
```

## Linux modules

### Copy modules from our Linux Kernel
We want to use the modules from the previously built Linux kernel.
First we create a target directory to copy these files.
```bash
linux_dir=../linux-4.14/
linux_ver=4.14.101-xilinx
modules_dir=alpine-modloop/lib/modules/$linux_ver
mkdir -p $modules_dir/kernel
```

Now look for all `.ko` files in the kernel and copy them to the new location.
This command looks for all `.ko` files, sets user and group to `0` and copies them to the target location.
```bash
find $linux_dir -name \*.ko -printf '%P\0' | tar --directory=$linux_dir --owner=0 --group=0 --null --files-from=- -zcf - | tar -zxf - --directory=$modules_dir/kernel
```

Copy the modules order and builtin files to the destination.
```bash
cp $linux_dir/modules.order $linux_dir/modules.builtin $modules_dir/
```

From the copied kernel modules we generate modules.dep and map files.
```bash
depmod -a -b alpine-modloop $linux_ver
```

### Kernel modules form Alpine
Now we copy selected firmware binaries from the alpine firmware archive into our alpine-modloop directory.

 - Copy all `ar*` files
 - Copy all `rt*` files

```bash
tar -zxf $firmware_tar --directory=alpine-modloop/lib/modules --warning=no-unknown-keyword --strip-components=1 --wildcards lib/firmware/ar* lib/firmware/rt*
```

Additional firmware download and untar:
```bash
add_fw="linux-firmware-ath9k_htc-20190322-r0.apk linux-firmware-brcm-20190322-r0.apk linux-firmware-rtlwifi-20190322-r0.apk"
for tar in $add_fw
do
  url=$alpine_url/main/armv7/$tar
  curl -L $url -o $tar
  tar -zxf $tar --directory=alpine-modloop/lib/modules --warning=no-unknown-keyword --strip-components=1
done
```

### Pack kernel modules and firmware
Now we pack the kernel modules and firmware into a squashfs file using xz compression.
```bash
mksquashfs alpine-modloop/lib modloop -b 1048576 -comp xz -Xdict-size 100%
```

## Create root
Now its time to create the root partition and some empty directories.

### Preparations
Create directory.
```bash
root_dir=alpine-root
mkdir -p $root_dir/usr/bin
mkdir -p $root_dir/etc
mkdir -p $root_dir/etc/apk
```

Create an apk cache where the SD-card will be mounted on the target.
```bash
mkdir -p $root_dir/media/mmcblk0p1/cache
ln -s /media/mmcblk0p1/cache $root_dir/etc/apk/cache
```

Copy contents from apline root dir into alpine-root.
```bash
cp -r alpine/root/etc $root_dir/
```

Copy alpine binary and qemu arm CPU emulator to install alpine.
Further, for the chroot environment to find the alpine servers, our hosts resolv config is copied.
```bash
cp -r alpine-tools/sbin $root_dir/
cp /usr/bin/qemu-arm-static $root_dir/usr/bin/
cp /etc/resolv.conf $root_dir/etc/
```

We now install alpine by running apk.static in a chroot.

 - apk is the alpine packet manager
 - `--repository $alpine_url/main` tells apk which repository to use
 - `--update-cache` does what it says it does
 - `--allow-untrusted` yap, even unsigned packages
 - `--initdb` undocumented
 - `add alpine-base` tell apk to install the alpine base system

```bash
sudo chroot $root_dir /sbin/apk.static \
  --repository $alpine_url/main \
  --update-cache --allow-untrusted --initdb \
  add alpine-base
```

Create a repositories file for upstream repository path.
```bash
echo $alpine_url/main > $root_dir/etc/apk/repositories
echo $alpine_url/community >> $root_dir/etc/apk/repositories
```

### Chroot
Now we chroot into the alpine-base installation and complete further installations.
```bash
sudo chroot $root_dir /bin/sh
```

#### Install some packages
```bash
apk update
apk add haveged openssh iw iptables curl wget less nano bc dcron

```

#### init system
Alpine-linux uses [OpenRC](https://wiki.gentoo.org/wiki/OpenRC) for its init system.
More infos can be found [here](https://wiki.alpinelinux.org/wiki/Alpine_Linux_Init_System).
Add services to the boot runlevel. From the alpine documentation:

_Generally the only services you should add to the boot runlevel are those which deal with the mounting of filesystems, set the initial state of attached peripherals and logging_

```bash
ln -s /etc/init.d/bootmisc etc/runlevels/boot/bootmisc
ln -s /etc/init.d/hostname etc/runlevels/boot/hostname
ln -s /etc/init.d/hwdrivers etc/runlevels/boot/hwdrivers
ln -s /etc/init.d/modloop etc/runlevels/boot/modloop
ln -s /etc/init.d/swclock etc/runlevels/boot/swclock
ln -s /etc/init.d/sysctl etc/runlevels/boot/sysctl
ln -s /etc/init.d/syslog etc/runlevels/boot/syslog
ln -s /etc/init.d/urandom etc/runlevels/boot/urandom
```

For the shutdown runlevel:

_Changes to the shutdown runlevel and then halts the host._

```bash
ln -s /etc/init.d/killprocs etc/runlevels/shutdown/killprocs
ln -s /etc/init.d/mount-ro etc/runlevels/shutdown/mount-ro
ln -s /etc/init.d/savecache etc/runlevels/shutdown/savecache
```

For the sysinit runlevel:

_Brings up any system specific stuff such as /dev, /proc and optionally /sys for Linux based systems_

```bash
ln -s /etc/init.d/devfs etc/runlevels/sysinit/devfs
ln -s /etc/init.d/dmesg etc/runlevels/sysinit/dmesg
ln -s /etc/init.d/mdev etc/runlevels/sysinit/mdev
```

Add some services to the default runlevel.
```bash
rc-update add local default
rc-update add dcron default
rc-update add haveged default
rc-update add sshd default
```

#### Configuration
Setup ssh deamon.
```bash
# permit root login
sed -i 's/^#PermitRootLogin.*/PermitRootLogin yes/' etc/ssh/sshd_config
```

Change root password.
```bash
passwd=root
echo root:$passwd | chpasswd
```

Set hostname.
```bash
hostname=red-pitaya
setup-hostname $hostname
hostname $hostname
```

Add some aliases to the root `.profile`.
```bash
cat <<- EOF_CAT > root/.profile
alias rw='mount -o rw,remount /media/mmcblk0p1'
alias ro='mount -o ro,remount /media/mmcblk0p1'
EOF_CAT
```

Configure alpine local backup to backup to SD card partition 1.
Also include some directories.
`lbu` only includes `/etc` per default.
More documentation on lbu [here](https://wiki.alpinelinux.org/wiki/Alpine_local_backup).
```bash
sed -i 's/^# LBU_MEDIA=.*/LBU_MEDIA=mmcblk0p1/' etc/lbu/lbu.conf
lbu add root
lbu delete etc/resolv.conf
lbu delete root/.ash_history
```

Create backup
```bash
lbu commit -d
```

#### Finish up
We now exit the chroot and restore our hostname.
```bash
exit
sudo hostname -F /etc/hostname
```

## Create ZIP
We now created all necessary files folders and filesystems.
For convenience we copy all needed ressources in a new folder.

```bash
zip_dir=alpine-zip
mkdir -p $zip_dir

cp ../boot.bin $zip_dir/
cp ../uImage $zip_dir/
cp ../devicetree.dtb $zip_dir/
cp ../uEnv.txt $zip_dir/

cp -r $root_dir/media/mmcblk0p1/cache $zip_dir/
cp $root_dir/media/mmcblk0p1/red-pitaya.apkovl.tar.gz $zip_dir/
cp modloop $zip_dir/
cp uInitrd $zip_dir/
```
<div class="table-responsive">
<table class="table">
 <colgroup span = "3">
    <col width = "20%"></col>
    <col width = "15%"></col>
    <col width = "60%"></col>
 </colgroup>
<thead class="thead-dark">
<tr>
<th scope="col">Ressource</th>
<th scope="col">Source</th>
<th scope="col">Description</th>
</tr>
</thead>

<tbody>
<tr>
<td>boot.bin</td>
<td>Linux build</td>
<td>Contains the first stage bootloader, the initial bit file and the U-Boot bootloader</td>
</tr>

<tr>
<td>uImage</td>
<td>Linux build</td>
<td>The Linux kernel image</td>
</tr>

<tr>
<td>devicetree.dtb</td>
<td>Linux build</td>
<td>Devicetree binary blob</td>
</tr>

<tr>
<td>uEnv.txt</td>
<td>Linux build</td>
<td>Instructions for U-Boot at boot time</td>
</tr>

<tr>
<td>$root_dir/media/mmcblk0p1/cache</td>
<td>alpine</td>
<td></td>
</tr>

<tr>
<td>$root_dir/media/mmcblk0p1/red-pitaya.apkovl.tar.gz</td>
<td>alpine</td>
<td></td>
</tr>

<tr>
<td>modloop</td>
<td>alpine</td>
<td>Linux kernel modules and custom alpine firmware and modules</td>
</tr>

<tr>
<td>uInitrd</td>
<td>alpine</td>
<td>Initial ramdisk containing alpine linux vanilla ramdisk</td>
</tr>
</tbody>
</table>
</div>

Zip all files that need to be copied to the SD-Card.
```bash
zip -r red-pitaya-alpine-3.9-armv7-`date +%Y%m%d`.zip $zip_dir/
```
