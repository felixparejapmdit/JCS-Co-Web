-- AOS100 / Cloud AOS - LOCAL DEVELOPMENT schema rebuilt from the legacy application code.
-- Source: PLAN.md Appendix A (columns found in the VB.NET code and decompiled AOS100web.dll).
-- Data types, keys and indexes are INFERRED from column names. This is NOT the production schema.
-- Replace it with a restore of the real production backup as soon as one is available.
-- Not created: views view_dodet, view_exphdr; runtime per-user tables tempglmaintbl_, tempgltranstbl_.

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `jcs` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `jcs`;

CREATE TABLE IF NOT EXISTS `acctcharttbl` (
  `acctdesc` VARCHAR(255) NULL,
  `acctno` VARCHAR(100) NULL,
  `acctno2` VARCHAR(100) NULL,
  `acctnopre` VARCHAR(100) NULL,
  `baxchrgs` VARCHAR(100) NULL,
  `cv` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `invcos` VARCHAR(100) NULL,
  `maingroup` VARCHAR(100) NULL,
  `motheracct` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `taxitm` VARCHAR(100) NULL,
  `upperacct` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `amstocktbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `areatbl` (
  `areaname` VARCHAR(255) NULL,
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `covarea` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `authtbl` (
  `appstat` VARCHAR(100) NULL,
  `form` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `maxamt` DECIMAL(18,4) NULL,
  `module` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bankdepdettbl` (
  `acctno` VARCHAR(100) NULL,
  `cashamt` DECIMAL(18,4) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `checkamt` DECIMAL(18,4) NULL,
  `depno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bankdephdrtbl` (
  `branch` VARCHAR(100) NULL,
  `depno` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `banktbl` (
  `acctno` VARCHAR(100) NULL,
  `accttype` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bankname` VARCHAR(255) NULL,
  `chprefix` VARCHAR(100) NULL,
  `chsize` VARCHAR(100) NULL,
  `depository` VARCHAR(100) NULL,
  `owner` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `batbl` (
  `add_birform` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `apprvdby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bir_sign` VARCHAR(100) NULL,
  `bir_sign_poss` VARCHAR(100) NULL,
  `bir_sign_tin` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `ccadmin` VARCHAR(100) NULL,
  `cclogis` VARCHAR(100) NULL,
  `ccprod` VARCHAR(100) NULL,
  `ccsales` VARCHAR(100) NULL,
  `cctech` VARCHAR(100) NULL,
  `cdcrproc` VARCHAR(100) NULL,
  `cotin1` VARCHAR(100) NULL,
  `cotin2` VARCHAR(100) NULL,
  `cotin3` VARCHAR(100) NULL,
  `cotin4` VARCHAR(100) NULL,
  `dloadstat` VARCHAR(100) NULL,
  `hmdfcon15` VARCHAR(100) NULL,
  `hmdfcon30` VARCHAR(100) NULL,
  `hmdfconw1` VARCHAR(100) NULL,
  `hmdfconw2` VARCHAR(100) NULL,
  `hmdfconw3` VARCHAR(100) NULL,
  `hmdfconw4` VARCHAR(100) NULL,
  `nonexps` VARCHAR(100) NULL,
  `notedby` VARCHAR(100) NULL,
  `ph_max` VARCHAR(100) NULL,
  `ph_mid` VARCHAR(100) NULL,
  `ph_min` VARCHAR(100) NULL,
  `ph_rate` DECIMAL(18,4) NULL,
  `phcon15` VARCHAR(100) NULL,
  `phcon30` VARCHAR(100) NULL,
  `phconw1` VARCHAR(100) NULL,
  `phconw2` VARCHAR(100) NULL,
  `phconw3` VARCHAR(100) NULL,
  `phconw4` VARCHAR(100) NULL,
  `poapprby` VARCHAR(100) NULL,
  `server_note` TEXT NULL,
  `shrtname` VARCHAR(255) NULL,
  `ssscon15` VARCHAR(100) NULL,
  `ssscon30` VARCHAR(100) NULL,
  `sssconw1` VARCHAR(100) NULL,
  `sssconw2` VARCHAR(100) NULL,
  `sssconw3` VARCHAR(100) NULL,
  `sssconw4` VARCHAR(100) NULL,
  `ssstable` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `taxextra` VARCHAR(100) NULL,
  `zip` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bir_ewttbl` (
  `cotype` VARCHAR(100) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtdesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `buddettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `datefr` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cctrnotbl` (
  `acctnopre` VARCHAR(100) NULL,
  `amt` DECIMAL(18,4) NULL,
  `attsource` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `brcode` VARCHAR(100) NULL,
  `budccno` VARCHAR(100) NULL,
  `ccdesc` VARCHAR(255) NULL,
  `ccdesc2` VARCHAR(255) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `ccnogrp` VARCHAR(100) NULL,
  `cosexp` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `prodgrp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cdcrtbl` (
  `branch` VARCHAR(100) NULL,
  `cashamt` DECIMAL(18,4) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `checkamt` DECIMAL(18,4) NULL,
  `depno` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `onlineamt` DECIMAL(18,4) NULL,
  `pdcamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cgbatchtbl` (
  `batchno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vp_no` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `coldettbl` (
  `branch` VARCHAR(100) NULL,
  `coltype` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `daitmno` VARCHAR(100) NULL,
  `depapp` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `netcolamt` DECIMAL(18,4) NULL,
  `oramt` DECIMAL(18,4) NULL,
  `origamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `orno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `colhdrtbl` (
  `areano` VARCHAR(100) NULL,
  `bank` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `cdcrstat` VARCHAR(100) NULL,
  `cheqstat` VARCHAR(100) NULL,
  `chno` VARCHAR(100) NULL,
  `colamt` DECIMAL(18,4) NULL,
  `coldate` DATE NULL,
  `coltype` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `ewtrem` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `origcustno` VARCHAR(100) NULL,
  `orno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `remarks` TEXT NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `valstat` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cosdettbl` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosno` VARCHAR(100) NULL,
  `dlcost` DECIMAL(18,4) NULL,
  `dlkg` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `ohkg` DECIMAL(18,4) NULL,
  `packcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `coshdrtbl` (
  `cosno` VARCHAR(100) NULL,
  `glstat` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cosinvtbl` (
  `codeno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `currencytbl` (
  `currency` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custdmcmdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cmamt` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `ewtform` VARCHAR(100) NULL,
  `glacct1` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custdmcmhdrtbl` (
  `apprvdby` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `glstat` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `reasons` TEXT NULL,
  `remarks` TEXT NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmasttbl` (
  `accttype` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `areano` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `busstype` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `contactno` VARCHAR(100) NULL,
  `crlimit` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `custnofrom` VARCHAR(100) NULL,
  `custtype` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datechange` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `discopt` VARCHAR(100) NULL,
  `drbiropt` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `fname` VARCHAR(255) NULL,
  `moacctno` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `prevmoacctno` VARCHAR(100) NULL,
  `searchname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmasttbl_update` (
  `accttype` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `areano` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `busstype` VARCHAR(100) NULL,
  `contactno` VARCHAR(100) NULL,
  `crlimit` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `custnofrom` VARCHAR(100) NULL,
  `custtype` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `disc` VARCHAR(100) NULL,
  `discopt` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `fname` VARCHAR(255) NULL,
  `lotopt` VARCHAR(100) NULL,
  `lotpref` VARCHAR(100) NULL,
  `moacctno` VARCHAR(100) NULL,
  `oldno` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `prevmoacctno` VARCHAR(100) NULL,
  `saveloan` VARCHAR(100) NULL,
  `searchname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `updatetype` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmmtbl` (
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entryfr` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tcref` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vpdate` DATE NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cvhdrtbl` (
  `ba` VARCHAR(100) NULL,
  `bank` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `chdate` DATE NULL,
  `chno` VARCHAR(100) NULL,
  `chsize` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `payeename` VARCHAR(255) NULL,
  `payeetype` VARCHAR(100) NULL,
  `postingdate` DATE NULL,
  `refdoc` VARCHAR(100) NULL,
  `reldate` DATE NULL,
  `relstat` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `delmontbl` (
  `docno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `depapptbl` (
  `actdocno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `netcolamt` DECIMAL(18,4) NULL,
  `note` TEXT NULL,
  `oramt` DECIMAL(18,4) NULL,
  `ordate` DATE NULL,
  `orno` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `savestat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `depttbl` (
  `appby1` VARCHAR(100) NULL,
  `appby2` VARCHAR(100) NULL,
  `appby3` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `dept` VARCHAR(100) NULL,
  `deptname` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `doclocktbl` (
  `docno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `stat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `dsrnotbl` (
  `branch` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrno_amstock` VARCHAR(100) NULL,
  `exceprep` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `olddsrno` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc62amt` DECIMAL(18,4) NULL,
  `tc84amt` DECIMAL(18,4) NULL,
  `tc85amt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `expdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `datechange` DATETIME NULL,
  `depstat` VARCHAR(100) NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entryfr` VARCHAR(100) NULL,
  `ewtbase` DECIMAL(18,4) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtrate` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `itemno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `remarksline` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `updateby` DATE NULL,
  `venno` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `exphdrtbl` (
  `amortamt` DECIMAL(18,4) NULL,
  `auditby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `caend` VARCHAR(100) NULL,
  `caseq` VARCHAR(100) NULL,
  `castart` VARCHAR(100) NULL,
  `caterms` VARCHAR(100) NULL,
  `cvby` VARCHAR(100) NULL,
  `cvdate` DATE NULL,
  `cvno` VARCHAR(100) NULL,
  `cvstat` VARCHAR(100) NULL,
  `dateaudit` DATETIME NULL,
  `datechange` DATETIME NULL,
  `datefr` DATE NULL,
  `datepost` DATETIME NULL,
  `dateto` DATE NULL,
  `dept` VARCHAR(100) NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `forliq` VARCHAR(100) NULL,
  `invdate` DATE NULL,
  `liqstat` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `parkdate` DATE NULL,
  `pono` VARCHAR(100) NULL,
  `postedby` VARCHAR(100) NULL,
  `recur` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `reflabel` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `replno` VARCHAR(100) NULL,
  `reprtcounter` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpbals` DECIMAL(18,4) NULL,
  `vpno2` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `formstbl` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `formtype` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `fundrepltbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `changeby` VARCHAR(100) NULL,
  `docnofr` VARCHAR(100) NULL,
  `docnoto` VARCHAR(100) NULL,
  `postingdate` DATE NULL,
  `remarks` TEXT NULL,
  `replno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totalamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entrytype` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvdettbl_update` (
  `acctno` VARCHAR(100) NULL,
  `astag` VARCHAR(100) NULL,
  `astagdate` DATETIME NULL,
  `astaguser` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entrytype` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `subaccttype` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `updatedate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vatstat` VARCHAR(100) NULL,
  `voidtransid` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvhdrtbl` (
  `apppostdate` DATETIME NULL,
  `branch` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dfrom` DATE NULL,
  `dramt` DECIMAL(18,4) NULL,
  `dto` DATE NULL,
  `entrytype` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `jvtype` VARCHAR(100) NULL,
  `postby` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `glmaintranstbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dateposted` DATETIME NULL,
  `dfrom` DATE NULL,
  `dramt` DECIMAL(18,4) NULL,
  `dto` DATE NULL,
  `entrytype` VARCHAR(100) NULL,
  `glstatus` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `jvtype` VARCHAR(100) NULL,
  `maingroup` VARCHAR(100) NULL,
  `monstat` VARCHAR(100) NULL,
  `motheracct` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `postedby` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `upperacct` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gltransmonstatus` (
  `audit1` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `dateaudit1` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `dfrom` DATE NULL,
  `dto` DATE NULL,
  `monstat` VARCHAR(100) NULL,
  `reopen` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearendcltype` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gltranstbl` (
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dateposted` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `drcr` VARCHAR(100) NULL,
  `glstatus` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `jvno` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `posttype` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vericheck` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invadjdettbl` (
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `stdqty` DECIMAL(18,4) NULL,
  `stdwt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invadjhdrtbl` (
  `dono` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invdetmontbl` (
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invdettbl` (
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `expdate` DATE NULL,
  `foh` DECIMAL(18,4) NULL,
  `inadjtqtybeg` VARCHAR(100) NULL,
  `inadjtwtbeg` VARCHAR(100) NULL,
  `initqtybeg` VARCHAR(100) NULL,
  `initwtbeg` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `prodqtybeg` VARCHAR(100) NULL,
  `prodwtbeg` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `recqtybeg` VARCHAR(100) NULL,
  `recwtbeg` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `uccos` VARCHAR(100) NULL,
  `ucstat` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vatvpamt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invhdrtbl` (
  `ba` VARCHAR(100) NULL,
  `bafrom` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `disposby` VARCHAR(100) NULL,
  `disposdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `formno` VARCHAR(100) NULL,
  `formtype` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `labstat` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mfgdate` DATE NULL,
  `mmrrno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `recvddate` DATE NULL,
  `remarks` TEXT NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `tactwt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `tqty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `twt` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invmmdettbl` (
  `codeno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issdettbl` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosamt` DECIMAL(18,4) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `idno` VARCHAR(100) NULL,
  `issby` VARCHAR(100) NULL,
  `issdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `issqtybeg` VARCHAR(100) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `isswtbeg` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `outadjtqtybeg` VARCHAR(100) NULL,
  `outadjtwtbeg` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issdettbl_update` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `updateid` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `isshdrtbl` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `checkedby` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `driver` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fgmmgrp` VARCHAR(100) NULL,
  `invdate` DATE NULL,
  `invno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mfgdate` DATE NULL,
  `mov` VARCHAR(100) NULL,
  `nosi` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdupdate` DATE NULL,
  `plateno` VARCHAR(100) NULL,
  `plntdest` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `produce` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `salesdoc` VARCHAR(100) NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `isshdrtbl_update` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `checkedby` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `driver` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fgmmgrp` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `nosi` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plateno` VARCHAR(100) NULL,
  `plntdest` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `updatedate` DATE NULL,
  `updateid` DATE NULL,
  `updatetype` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issscrpdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issscrphdrtbl` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lotnotbl` (
  `codeno` VARCHAR(100) NULL,
  `expirydate` DATE NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `lotno` VARCHAR(100) NULL,
  `noofbatch` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `prodtype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mmastprttbl` (
  `codeno` VARCHAR(100) NULL,
  `dcreate` DATETIME NULL,
  `mmdesc` VARCHAR(255) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mmasttbl` (
  `admdigit` VARCHAR(100) NULL,
  `basecodeno` VARCHAR(100) NULL,
  `basematl` VARCHAR(100) NULL,
  `bcodenogrp` VARCHAR(100) NULL,
  `billref` VARCHAR(100) NULL,
  `codename` VARCHAR(255) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosbillref` VARCHAR(100) NULL,
  `glacct` VARCHAR(100) NULL,
  `invlevel` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `maintype` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `packing` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `precodeno` VARCHAR(100) NULL,
  `produce` VARCHAR(100) NULL,
  `qtpk` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `trade` VARCHAR(100) NULL,
  `tradeonly` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ucdigit` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `wtfr` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `modtranstattbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `dateaudit1` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `dfrom` DATE NULL,
  `dto` DATE NULL,
  `monstat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `montranstbl` (
  `dto` DATE NULL,
  `transtype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `movplnttbl` (
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `movtbl` (
  `form` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `movdesc` VARCHAR(255) NULL,
  `soporeq` VARCHAR(100) NULL,
  `ttype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payadjttbl` (
  `adjtamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paycommtbl` (
  `empno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `totcomm` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paydeducttbl` (
  `basictax` VARCHAR(100) NULL,
  `basictaxamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `cashadvance` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `earnforcontn` VARCHAR(100) NULL,
  `ecc` DECIMAL(18,4) NULL,
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `excesstaxamt` DECIMAL(18,4) NULL,
  `grossearn` DECIMAL(18,4) NULL,
  `hdmfaddlprem` DECIMAL(18,4) NULL,
  `hdmfexp` VARCHAR(100) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `idno` VARCHAR(100) NULL,
  `monyear` VARCHAR(100) NULL,
  `mtdearncontn` VARCHAR(100) NULL,
  `mtdhdmf` VARCHAR(100) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `otherdeduct` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `sssexp` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `sysver` VARCHAR(100) NULL,
  `taxableamt` DECIMAL(18,4) NULL,
  `taxablegross` VARCHAR(100) NULL,
  `taxableupdate` DATE NULL,
  `taxdednfrearn` VARCHAR(100) NULL,
  `taxdue` DECIMAL(18,4) NULL,
  `taxrate` DECIMAL(18,4) NULL,
  `totaldeduct` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paydtrtbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `eq_hrs_late` VARCHAR(100) NULL,
  `eq_hrs_ut` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `in_rem` VARCHAR(100) NULL,
  `inam` VARCHAR(100) NULL,
  `out_rem` VARCHAR(100) NULL,
  `outpm` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `shiftcode2` VARCHAR(100) NULL,
  `stdin` VARCHAR(100) NULL,
  `stdout` VARCHAR(100) NULL,
  `terminam` VARCHAR(100) NULL,
  `tot_late_hrs` DECIMAL(18,4) NULL,
  `tot_ut_hrs` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payearnmasttbl` (
  `codeno` VARCHAR(100) NULL,
  `earndesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL,
  `type` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payearntbl` (
  `absent_amt` DECIMAL(18,4) NULL,
  `absent_hrs` DECIMAL(18,4) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `ca` VARCHAR(100) NULL,
  `cbond` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `comm_amt` DECIMAL(18,4) NULL,
  `elamt` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_amt` DATETIME NULL,
  `extratime_dhrs` DATETIME NULL,
  `hdmfhousloan` VARCHAR(100) NULL,
  `hdmfsalloan` VARCHAR(100) NULL,
  `holidayamt` DECIMAL(18,4) NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `hrrated` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `late_amt` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `monyear` VARCHAR(100) NULL,
  `nightdiffamt` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `otataxable` VARCHAR(100) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `othearn_amt` DECIMAL(18,4) NULL,
  `othrleaveamt` DECIMAL(18,4) NULL,
  `othrleavehrs` DECIMAL(18,4) NULL,
  `otime_amt` DATETIME NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `ratereg` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `regtime_amt` DATETIME NULL,
  `regtime_dhrs` DATETIME NULL,
  `remarks` TEXT NULL,
  `sl_amt` DECIMAL(18,4) NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `splotamt` DECIMAL(18,4) NULL,
  `splothrs` DECIMAL(18,4) NULL,
  `ssssalaryloan` VARCHAR(100) NULL,
  `taxablegross` VARCHAR(100) NULL,
  `telallow` VARCHAR(100) NULL,
  `totalearn` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transpoallow` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vl_amt` DECIMAL(18,4) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL,
  `web` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payemployeetbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `empstat` VARCHAR(100) NULL,
  `firstname` VARCHAR(255) NULL,
  `lastname` VARCHAR(255) NULL,
  `paytype` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payfintbl` (
  `basicpay` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ecc` DECIMAL(18,4) NULL,
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `hdmfaddlprem` DECIMAL(18,4) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `hrrate` DECIMAL(18,4) NULL,
  `hrrated` VARCHAR(100) NULL,
  `loadallow` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payidno` VARCHAR(100) NULL,
  `paymode` VARCHAR(100) NULL,
  `paystat` VARCHAR(100) NULL,
  `payto` DATE NULL,
  `paytype` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `transallow` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtbirannualtbl` (
  `basic` DECIMAL(18,4) NULL,
  `excesrate` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtbirtbl` (
  `basic` DECIMAL(18,4) NULL,
  `excempcode` VARCHAR(100) NULL,
  `excesrate` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL,
  `paytype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtphtbl` (
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL,
  `ratelabel` VARCHAR(100) NULL,
  `ratetype` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payidnostattbl` (
  `att` VARCHAR(100) NULL,
  `attdate` DATETIME NULL,
  `attuser` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `deduct` VARCHAR(100) NULL,
  `deductdate` DATETIME NULL,
  `deductuser` VARCHAR(100) NULL,
  `earn` VARCHAR(100) NULL,
  `earndate` DATETIME NULL,
  `earnuser` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `netdate` DATETIME NULL,
  `netuser` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payidtbl` (
  `codeno` VARCHAR(100) NULL,
  `commdate1` DATE NULL,
  `commdate2` DATE NULL,
  `datechngstat` DATETIME NULL,
  `datecreate` DATE NULL,
  `dateupdate` DATETIME NULL,
  `empno` VARCHAR(100) NULL,
  `idstat` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `monyear` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `paystat` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `pdatefr` DATE NULL,
  `pdateto` DATE NULL,
  `rate` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `userchngstat` VARCHAR(100) NULL,
  `userupdate` DATE NULL,
  `web` VARCHAR(100) NULL,
  `workdays` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payitemstbl` (
  `itemtype` VARCHAR(100) NULL,
  `itmgrp` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payitemdesc` VARCHAR(255) NULL,
  `tablefield1` VARCHAR(100) NULL,
  `tablefield2` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payitmccnotbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payloanmasttbl` (
  `amortamt` DECIMAL(18,4) NULL,
  `dateend` DATE NULL,
  `datestart` DATE NULL,
  `empno` VARCHAR(100) NULL,
  `loanamt` DECIMAL(18,4) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `loanstat` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `terms` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paymealallowtbl` (
  `empno` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payndifftbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `earnrate` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `ndamt` DECIMAL(18,4) NULL,
  `ndcode` VARCHAR(100) NULL,
  `ndhrs` DECIMAL(18,4) NULL,
  `ndrate` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payndratetbl` (
  `ndcode` VARCHAR(100) NULL,
  `nddesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payotdtbl` (
  `adjtamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payotearntbl` (
  `amt` DECIMAL(18,4) NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `rate` DECIMAL(18,4) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payothrloantbl` (
  `amt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paysliptbl` (
  `cbondytd` DECIMAL(18,4) NULL,
  `ccdesc` VARCHAR(255) NULL,
  `ccno` VARCHAR(100) NULL,
  `comm_amt` DECIMAL(18,4) NULL,
  `elamt` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_amt` DATETIME NULL,
  `extratime_dhrs` DATETIME NULL,
  `hdmfhausbal` DECIMAL(18,4) NULL,
  `hdmfsalbal` DECIMAL(18,4) NULL,
  `holidayamt` DECIMAL(18,4) NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `late_amt` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `nightdiffamt` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `othearn_amt` DECIMAL(18,4) NULL,
  `otime_amt` DATETIME NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `ratereg` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `regtime_amt` DATETIME NULL,
  `regtime_dhrs` DATETIME NULL,
  `sl_amt` DECIMAL(18,4) NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `ssssalbal` DECIMAL(18,4) NULL,
  `totalearn` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vl_amt` DECIMAL(18,4) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL,
  `web` VARCHAR(100) NULL,
  `ytdgross` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payvlslapptbl` (
  `dateendappr` DATE NULL,
  `datestartappr` DATE NULL,
  `daysappr` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `hrsappr` VARCHAR(100) NULL,
  `leaveamt` DECIMAL(18,4) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payvlsltbl` (
  `empno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pctrtbl` (
  `acctno` VARCHAR(100) NULL,
  `aracctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `ccadmin` VARCHAR(100) NULL,
  `cclogis` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccnoprod` VARCHAR(100) NULL,
  `ccprod` VARCHAR(100) NULL,
  `cctech` VARCHAR(100) NULL,
  `dsr` VARCHAR(100) NULL,
  `gldisc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pclass` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `tradetype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plnttbl` (
  `address` TEXT NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `fginv` VARCHAR(100) NULL,
  `fgrec` VARCHAR(100) NULL,
  `fgtrans` VARCHAR(100) NULL,
  `invset` VARCHAR(100) NULL,
  `ownertype` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `plntname` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `prodnplnt` VARCHAR(100) NULL,
  `rmcos` VARCHAR(100) NULL,
  `rminv` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `venno2` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plstreqtbl` (
  `areano` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currprc` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `effdate` DATE NULL,
  `oldsp` DECIMAL(18,4) NULL,
  `prvdate` DATE NULL,
  `reqstat` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plsttbl` (
  `codeno` VARCHAR(100) NULL,
  `currprc` DECIMAL(18,4) NULL,
  `drate` DECIMAL(18,4) NULL,
  `prvdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pmstocktbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `podettbl` (
  `amt` DECIMAL(18,4) NULL,
  `appqty` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `podettbl_update` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pohdrtbl` (
  `appby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currency` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `multiriv` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `podate` DATE NULL,
  `pono` VARCHAR(100) NULL,
  `poremarks` TEXT NULL,
  `postat` VARCHAR(100) NULL,
  `pototamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `rivno` VARCHAR(100) NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pohdrtbl_update` (
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currency` VARCHAR(100) NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `multiriv` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `postat` VARCHAR(100) NULL,
  `pototamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prodreqdettbl` (
  `codeno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `lotno` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `prodnstat` VARCHAR(100) NULL,
  `tardate` DATE NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prodreqhdrtbl` (
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prttbl` (
  `datereprt` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `reprtcounter` VARCHAR(100) NULL,
  `reprtstat` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `qryreqttbl` (
  `branch` VARCHAR(100) NULL,
  `createdby` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `reqname` VARCHAR(255) NULL,
  `reqtype` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `type1` VARCHAR(100) NULL,
  `type2` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reqsodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `prodreq` VARCHAR(100) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reqsohdrtbl` (
  `apprvdby` VARCHAR(100) NULL,
  `currbal` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `deldate` DATE NULL,
  `delstat` VARCHAR(100) NULL,
  `deposit` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdc` DECIMAL(18,4) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `soamt` DECIMAL(18,4) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `totar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rivdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `appamt` DECIMAL(18,4) NULL,
  `appqty` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `currinv` DECIMAL(18,4) NULL,
  `detstat` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `qtydel` DECIMAL(18,4) NULL,
  `rivno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rivhdrtbl` (
  `appby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `rivno` VARCHAR(100) NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `salesdettbl` (
  `acctno` VARCHAR(100) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dealstat` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmgrpdesc` VARCHAR(255) NULL,
  `nv` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `ucos` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `salesdettbl_update` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateid` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `saleshdrtbl` (
  `arflag` VARCHAR(100) NULL,
  `arflagdate` DATETIME NULL,
  `arflaguser` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `basecodeno` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fhamt` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `grossamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `otherbadoc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `postupdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `user2` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `saleshdrtbl_update` (
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fhamt` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `grossamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `otherbadoc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `postupdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `serverlogintbl` (
  `pcname` VARCHAR(255) NULL,
  `sysver` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `shrinkreporttbl` (
  `amqty` DECIMAL(18,4) NULL,
  `amstock` DECIMAL(18,4) NULL,
  `availablestck` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `doqty` DECIMAL(18,4) NULL,
  `dos` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `pcnt` DECIMAL(18,4) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty2` DECIMAL(18,4) NULL,
  `qty3` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `sales` DECIMAL(18,4) NULL,
  `shrinkage` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `varqty` DECIMAL(18,4) NULL,
  `wrr` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `signtbl` (
  `frmname` VARCHAR(255) NULL,
  `fullname` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `signtype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sloctbl` (
  `plntno` VARCHAR(100) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocdesc` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `smnmtbl` (
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `shrtname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `smntype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `issby` VARCHAR(100) NULL,
  `issdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `prodreq` VARCHAR(100) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sohdrtbl` (
  `apprdate` DATE NULL,
  `apprem` DECIMAL(18,4) NULL,
  `apprvdby` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `currbal` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `deldate` DATE NULL,
  `delstat` VARCHAR(100) NULL,
  `deposit` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdc` DECIMAL(18,4) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `soamt` DECIMAL(18,4) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `totar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `splpricetbl` (
  `custno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `subdoctbl` (
  `grpdoc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_forms` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `inused` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_mymenu` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `menudesc` VARCHAR(255) NULL,
  `menulabel` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_usergroup` (
  `ug_code` VARCHAR(100) NULL,
  `ug_name` VARCHAR(255) NULL,
  `ug_notes` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_usergrouprights` (
  `gr_deleterights` VARCHAR(100) NULL,
  `gr_editrights` VARCHAR(100) NULL,
  `gr_formcode` VARCHAR(100) NULL,
  `gr_groupcode` VARCHAR(100) NULL,
  `gr_insertrights` VARCHAR(100) NULL,
  `gr_releaserights` VARCHAR(100) NULL,
  `gr_viewrights` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_userrecords` (
  `empno` VARCHAR(100) NULL,
  `idstat` VARCHAR(100) NULL,
  `invchck` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pwhint` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `useremailaddress` VARCHAR(100) NULL,
  `userfullname` VARCHAR(255) NULL,
  `usergroup` VARCHAR(100) NULL,
  `userloc` VARCHAR(100) NULL,
  `username` VARCHAR(255) NULL,
  `usernotes` TEXT NULL,
  `userpassword` VARCHAR(100) NULL,
  `usertelno` VARCHAR(100) NULL,
  `verupdate` DATE NULL,
  `wfh` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tccodestbl` (
  `document` VARCHAR(100) NULL,
  `modlongname` VARCHAR(255) NULL,
  `module` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging` (
  `custname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `dep` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invno2` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc2` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging_` (
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `curr` VARCHAR(100) NULL,
  `custname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `datedue` DATE NULL,
  `days` DECIMAL(18,4) NULL,
  `dep` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging_or` (
  `curr` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `days` DECIMAL(18,4) NULL,
  `dep` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invno2` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc2` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempasp` (
  `amt` DECIMAL(18,4) NULL,
  `asp` DECIMAL(18,4) NULL,
  `avecos` DECIMAL(18,4) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmgrpdesc` VARCHAR(255) NULL,
  `pc` VARCHAR(100) NULL,
  `pclass` VARCHAR(100) NULL,
  `qtpk` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `uccos` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `varamt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostbl` (
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostingtbl` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosno` VARCHAR(100) NULL,
  `dlcost` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `totohamt` DECIMAL(18,4) NULL,
  `totrmamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostingtbl2` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcustbal` (
  `bussname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invbals` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `payment` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcvdettbl` (
  `dramt` DECIMAL(18,4) NULL,
  `itemno` VARCHAR(100) NULL,
  `tcref` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vpdate` DATE NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcwtdettbl` (
  `depapp` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `orno` VARCHAR(100) NULL,
  `pc2` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdmcmdetwebtbl` (
  `amt` DECIMAL(18,4) NULL,
  `docdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `stdqty` DECIMAL(18,4) NULL,
  `stdvar` DECIMAL(18,4) NULL,
  `stdwt` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet2` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet_` (
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodetprt` (
  `amount` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdsreport` (
  `amqty` DECIMAL(18,4) NULL,
  `amstock` DECIMAL(18,4) NULL,
  `availablestck` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `doqty` DECIMAL(18,4) NULL,
  `dos` DECIMAL(18,4) NULL,
  `netavail_qty` DECIMAL(18,4) NULL,
  `netavail_wt` DECIMAL(18,4) NULL,
  `pcnt` DECIMAL(18,4) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty2` DECIMAL(18,4) NULL,
  `qty3` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `sales` DECIMAL(18,4) NULL,
  `salesman` VARCHAR(255) NULL,
  `shrinkage` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `varqty` DECIMAL(18,4) NULL,
  `wrr` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdsrstck` (
  `codeno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexpdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `ewtbase` DECIMAL(18,4) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtrate` DECIMAL(18,4) NULL,
  `itemno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexphdrtbl` (
  `branch` VARCHAR(100) NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `payee` VARCHAR(255) NULL,
  `remarks` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexpsumtbl` (
  `datechange` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `expl` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempfgcostingtbl` (
  `asp` DECIMAL(18,4) NULL,
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `ucos` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgledit` (
  `balamt` DECIMAL(18,4) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgljvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgljvtbl` (
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `jvno3` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempglmaintbl` (
  `acctdesc` VARCHAR(255) NULL,
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `begamt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgltranstbl` (
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvbals` (
  `codeno` VARCHAR(100) NULL,
  `etadate` DATE NULL,
  `expdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `recqty` DECIMAL(18,4) NULL,
  `recwt` DECIMAL(18,4) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wrrwt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvbalsnew_` (
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qtybalbeg` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wtbalbeg` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `expdate` DATE NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvtbl` (
  `codeno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qty_bal` DECIMAL(18,4) NULL,
  `qty_in` VARCHAR(100) NULL,
  `qty_out` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt_bal` DECIMAL(18,4) NULL,
  `wt_in` VARCHAR(100) NULL,
  `wt_out` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvtbl2` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `costamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty_bal` DECIMAL(18,4) NULL,
  `qty_in` VARCHAR(100) NULL,
  `qty_out` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt_bal` DECIMAL(18,4) NULL,
  `wt_in` VARCHAR(100) NULL,
  `wt_out` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempissdettbl` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempisshdrtbl` (
  `dono` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `templotnotbl` (
  `codeno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `note` TEXT NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempmodstattbl` (
  `audit1` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `jvno` VARCHAR(100) NULL,
  `modname` VARCHAR(255) NULL,
  `refno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayadjt` (
  `adjtamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `mainidno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaycommtbl` (
  `autoamt` DECIMAL(18,4) NULL,
  `commadjt` DECIMAL(18,4) NULL,
  `empname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `totcomm` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaydeno` (
  `b100` DECIMAL(18,4) NULL,
  `b1000` DECIMAL(18,4) NULL,
  `b1000amt` DECIMAL(18,4) NULL,
  `b1000excess` DECIMAL(18,4) NULL,
  `b100amt` DECIMAL(18,4) NULL,
  `b100excess` DECIMAL(18,4) NULL,
  `b20` DECIMAL(18,4) NULL,
  `b200` DECIMAL(18,4) NULL,
  `b200amt` DECIMAL(18,4) NULL,
  `b200excess` DECIMAL(18,4) NULL,
  `b20amt` DECIMAL(18,4) NULL,
  `b20excess` DECIMAL(18,4) NULL,
  `b50` DECIMAL(18,4) NULL,
  `b500` DECIMAL(18,4) NULL,
  `b500amt` DECIMAL(18,4) NULL,
  `b500excess` DECIMAL(18,4) NULL,
  `b50amt` DECIMAL(18,4) NULL,
  `b50excess` DECIMAL(18,4) NULL,
  `c1` DECIMAL(18,4) NULL,
  `c10` DECIMAL(18,4) NULL,
  `c10amt` DECIMAL(18,4) NULL,
  `c10excess` DECIMAL(18,4) NULL,
  `c1amt` DECIMAL(18,4) NULL,
  `c1excess` DECIMAL(18,4) NULL,
  `c5` DECIMAL(18,4) NULL,
  `c5amt` DECIMAL(18,4) NULL,
  `c5excess` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayearntbl` (
  `absent_hrs` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empfullname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_dhrs` DATETIME NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `othrleavehrs` DECIMAL(18,4) NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `regtime_dhrs` DATETIME NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayloansalltbl` (
  `bank11` VARCHAR(100) NULL,
  `bank12` VARCHAR(100) NULL,
  `ca1` VARCHAR(100) NULL,
  `ca2` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hdmfhse1` VARCHAR(100) NULL,
  `hdmfhse2` VARCHAR(100) NULL,
  `hdmfsal1` VARCHAR(100) NULL,
  `hdmfsal2` VARCHAR(100) NULL,
  `othr3` VARCHAR(100) NULL,
  `ssscal1` VARCHAR(100) NULL,
  `ssscal2` VARCHAR(100) NULL,
  `ssssal1` VARCHAR(100) NULL,
  `ssssal2` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayndifftbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `ndcode` VARCHAR(100) NULL,
  `ndhrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayotd` (
  `adjtamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `loanrefno` VARCHAR(100) NULL,
  `mainidno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayotearntbl` (
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayothrloantbl` (
  `deductamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `loanamt` DECIMAL(18,4) NULL,
  `loanbalamt` DECIMAL(18,4) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaypcgrptbl` (
  `empno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaytaxannual` (
  `basictax` VARCHAR(100) NULL,
  `basictaxamt` DECIMAL(18,4) NULL,
  `earngross` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `excesstaxamt` DECIMAL(18,4) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `nettaxableinc` DECIMAL(18,4) NULL,
  `nettaxdue` DECIMAL(18,4) NULL,
  `otataxable` VARCHAR(100) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `taxableamtytd` DECIMAL(18,4) NULL,
  `taxdue` DECIMAL(18,4) NULL,
  `taxrate` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayvlsltbl` (
  `begel` DECIMAL(18,4) NULL,
  `begsl` DECIMAL(18,4) NULL,
  `begvl` DECIMAL(18,4) NULL,
  `elbals` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `slbals` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `vlbals` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempplnttbl` (
  `plntno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temprivdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `currinv` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsalesdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsalesdettbl2` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `translog` (
  `datetimelog` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `form` VARCHAR(100) NULL,
  `pcipadd` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `trans` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `updatetbl` (
  `dateupdate` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `origname` VARCHAR(255) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `update_dateonly` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `userplnttbl` (
  `plntno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `venmasttbl` (
  `address` TEXT NULL,
  `address2` TEXT NULL,
  `branch` VARCHAR(100) NULL,
  `cgtype` VARCHAR(100) NULL,
  `chname` VARCHAR(255) NULL,
  `conper` VARCHAR(100) NULL,
  `cotype` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datechange` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `emailadd` VARCHAR(100) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `mmrrreq` VARCHAR(100) NULL,
  `pcfcust` VARCHAR(100) NULL,
  `poreq` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `telno` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `tin2` VARCHAR(100) NULL,
  `tin3` VARCHAR(100) NULL,
  `tin4` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `venname` VARCHAR(255) NULL,
  `venno` VARCHAR(100) NULL,
  `ventype` VARCHAR(100) NULL,
  `ventype2` VARCHAR(100) NULL,
  `whtax` VARCHAR(100) NULL,
  `zip1` VARCHAR(100) NULL,
  `zip2` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `voidreqtbl` (
  `appby` VARCHAR(100) NULL,
  `appdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `remarks` TEXT NULL,
  `reqstat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vdocno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wipdettbl` (
  `codeno` VARCHAR(100) NULL,
  `datepost` DATETIME NULL,
  `dono` VARCHAR(100) NULL,
  `dprno` VARCHAR(100) NULL,
  `fgtype` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `liqrepno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `source` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `stdcosamt` DECIMAL(18,4) NULL,
  `stduc` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ucstat` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wipno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wrrdettbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wrrno` VARCHAR(100) NULL,
  `wrrqtybeg` VARCHAR(100) NULL,
  `wrrwtbeg` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wrrhdrtbl` (
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `wrrno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `batbl` (`ba`, `bussname`) SELECT * FROM (SELECT '8100' a, 'JCS Chemical Industries, Inc.' b UNION ALL SELECT '8200', 'APF Corporation' UNION ALL SELECT '8300', 'Chemag Trading Corporation') x WHERE NOT EXISTS (SELECT 1 FROM `batbl`);

CREATE DATABASE IF NOT EXISTS `apf` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `apf`;

CREATE TABLE IF NOT EXISTS `acctcharttbl` (
  `acctdesc` VARCHAR(255) NULL,
  `acctno` VARCHAR(100) NULL,
  `acctno2` VARCHAR(100) NULL,
  `acctnopre` VARCHAR(100) NULL,
  `baxchrgs` VARCHAR(100) NULL,
  `cv` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `invcos` VARCHAR(100) NULL,
  `maingroup` VARCHAR(100) NULL,
  `motheracct` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `taxitm` VARCHAR(100) NULL,
  `upperacct` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `amstocktbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `areatbl` (
  `areaname` VARCHAR(255) NULL,
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `covarea` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `authtbl` (
  `appstat` VARCHAR(100) NULL,
  `form` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `maxamt` DECIMAL(18,4) NULL,
  `module` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bankdepdettbl` (
  `acctno` VARCHAR(100) NULL,
  `cashamt` DECIMAL(18,4) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `checkamt` DECIMAL(18,4) NULL,
  `depno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bankdephdrtbl` (
  `branch` VARCHAR(100) NULL,
  `depno` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `banktbl` (
  `acctno` VARCHAR(100) NULL,
  `accttype` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bankname` VARCHAR(255) NULL,
  `chprefix` VARCHAR(100) NULL,
  `chsize` VARCHAR(100) NULL,
  `depository` VARCHAR(100) NULL,
  `owner` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `batbl` (
  `add_birform` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `apprvdby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bir_sign` VARCHAR(100) NULL,
  `bir_sign_poss` VARCHAR(100) NULL,
  `bir_sign_tin` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `ccadmin` VARCHAR(100) NULL,
  `cclogis` VARCHAR(100) NULL,
  `ccprod` VARCHAR(100) NULL,
  `ccsales` VARCHAR(100) NULL,
  `cctech` VARCHAR(100) NULL,
  `cdcrproc` VARCHAR(100) NULL,
  `cotin1` VARCHAR(100) NULL,
  `cotin2` VARCHAR(100) NULL,
  `cotin3` VARCHAR(100) NULL,
  `cotin4` VARCHAR(100) NULL,
  `dloadstat` VARCHAR(100) NULL,
  `hmdfcon15` VARCHAR(100) NULL,
  `hmdfcon30` VARCHAR(100) NULL,
  `hmdfconw1` VARCHAR(100) NULL,
  `hmdfconw2` VARCHAR(100) NULL,
  `hmdfconw3` VARCHAR(100) NULL,
  `hmdfconw4` VARCHAR(100) NULL,
  `nonexps` VARCHAR(100) NULL,
  `notedby` VARCHAR(100) NULL,
  `ph_max` VARCHAR(100) NULL,
  `ph_mid` VARCHAR(100) NULL,
  `ph_min` VARCHAR(100) NULL,
  `ph_rate` DECIMAL(18,4) NULL,
  `phcon15` VARCHAR(100) NULL,
  `phcon30` VARCHAR(100) NULL,
  `phconw1` VARCHAR(100) NULL,
  `phconw2` VARCHAR(100) NULL,
  `phconw3` VARCHAR(100) NULL,
  `phconw4` VARCHAR(100) NULL,
  `poapprby` VARCHAR(100) NULL,
  `server_note` TEXT NULL,
  `shrtname` VARCHAR(255) NULL,
  `ssscon15` VARCHAR(100) NULL,
  `ssscon30` VARCHAR(100) NULL,
  `sssconw1` VARCHAR(100) NULL,
  `sssconw2` VARCHAR(100) NULL,
  `sssconw3` VARCHAR(100) NULL,
  `sssconw4` VARCHAR(100) NULL,
  `ssstable` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `taxextra` VARCHAR(100) NULL,
  `zip` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bir_ewttbl` (
  `cotype` VARCHAR(100) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtdesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `buddettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `datefr` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cctrnotbl` (
  `acctnopre` VARCHAR(100) NULL,
  `amt` DECIMAL(18,4) NULL,
  `attsource` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `brcode` VARCHAR(100) NULL,
  `budccno` VARCHAR(100) NULL,
  `ccdesc` VARCHAR(255) NULL,
  `ccdesc2` VARCHAR(255) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `ccnogrp` VARCHAR(100) NULL,
  `cosexp` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `prodgrp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cdcrtbl` (
  `branch` VARCHAR(100) NULL,
  `cashamt` DECIMAL(18,4) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `checkamt` DECIMAL(18,4) NULL,
  `depno` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `onlineamt` DECIMAL(18,4) NULL,
  `pdcamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cgbatchtbl` (
  `batchno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vp_no` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `coldettbl` (
  `branch` VARCHAR(100) NULL,
  `coltype` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `daitmno` VARCHAR(100) NULL,
  `depapp` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `netcolamt` DECIMAL(18,4) NULL,
  `oramt` DECIMAL(18,4) NULL,
  `origamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `orno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `colhdrtbl` (
  `areano` VARCHAR(100) NULL,
  `bank` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `cdcrstat` VARCHAR(100) NULL,
  `cheqstat` VARCHAR(100) NULL,
  `chno` VARCHAR(100) NULL,
  `colamt` DECIMAL(18,4) NULL,
  `coldate` DATE NULL,
  `coltype` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `ewtrem` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `origcustno` VARCHAR(100) NULL,
  `orno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `remarks` TEXT NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `valstat` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cosdettbl` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosno` VARCHAR(100) NULL,
  `dlcost` DECIMAL(18,4) NULL,
  `dlkg` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `ohkg` DECIMAL(18,4) NULL,
  `packcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `coshdrtbl` (
  `cosno` VARCHAR(100) NULL,
  `glstat` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cosinvtbl` (
  `codeno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `currencytbl` (
  `currency` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custdmcmdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cmamt` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `ewtform` VARCHAR(100) NULL,
  `glacct1` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custdmcmhdrtbl` (
  `apprvdby` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `glstat` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `reasons` TEXT NULL,
  `remarks` TEXT NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmasttbl` (
  `accttype` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `areano` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `busstype` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `contactno` VARCHAR(100) NULL,
  `crlimit` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `custnofrom` VARCHAR(100) NULL,
  `custtype` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datechange` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `discopt` VARCHAR(100) NULL,
  `drbiropt` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `fname` VARCHAR(255) NULL,
  `moacctno` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `prevmoacctno` VARCHAR(100) NULL,
  `searchname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmasttbl_update` (
  `accttype` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `areano` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `busstype` VARCHAR(100) NULL,
  `contactno` VARCHAR(100) NULL,
  `crlimit` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `custnofrom` VARCHAR(100) NULL,
  `custtype` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `disc` VARCHAR(100) NULL,
  `discopt` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `fname` VARCHAR(255) NULL,
  `lotopt` VARCHAR(100) NULL,
  `lotpref` VARCHAR(100) NULL,
  `moacctno` VARCHAR(100) NULL,
  `oldno` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `prevmoacctno` VARCHAR(100) NULL,
  `saveloan` VARCHAR(100) NULL,
  `searchname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `updatetype` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmmtbl` (
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entryfr` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tcref` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vpdate` DATE NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cvhdrtbl` (
  `ba` VARCHAR(100) NULL,
  `bank` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `chdate` DATE NULL,
  `chno` VARCHAR(100) NULL,
  `chsize` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `payeename` VARCHAR(255) NULL,
  `payeetype` VARCHAR(100) NULL,
  `postingdate` DATE NULL,
  `refdoc` VARCHAR(100) NULL,
  `reldate` DATE NULL,
  `relstat` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `delmontbl` (
  `docno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `depapptbl` (
  `actdocno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `netcolamt` DECIMAL(18,4) NULL,
  `note` TEXT NULL,
  `oramt` DECIMAL(18,4) NULL,
  `ordate` DATE NULL,
  `orno` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `savestat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `depttbl` (
  `appby1` VARCHAR(100) NULL,
  `appby2` VARCHAR(100) NULL,
  `appby3` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `dept` VARCHAR(100) NULL,
  `deptname` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `doclocktbl` (
  `docno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `stat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `dsrnotbl` (
  `branch` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrno_amstock` VARCHAR(100) NULL,
  `exceprep` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `olddsrno` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc62amt` DECIMAL(18,4) NULL,
  `tc84amt` DECIMAL(18,4) NULL,
  `tc85amt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `expdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `datechange` DATETIME NULL,
  `depstat` VARCHAR(100) NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entryfr` VARCHAR(100) NULL,
  `ewtbase` DECIMAL(18,4) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtrate` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `itemno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `remarksline` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `updateby` DATE NULL,
  `venno` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `exphdrtbl` (
  `amortamt` DECIMAL(18,4) NULL,
  `auditby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `caend` VARCHAR(100) NULL,
  `caseq` VARCHAR(100) NULL,
  `castart` VARCHAR(100) NULL,
  `caterms` VARCHAR(100) NULL,
  `cvby` VARCHAR(100) NULL,
  `cvdate` DATE NULL,
  `cvno` VARCHAR(100) NULL,
  `cvstat` VARCHAR(100) NULL,
  `dateaudit` DATETIME NULL,
  `datechange` DATETIME NULL,
  `datefr` DATE NULL,
  `datepost` DATETIME NULL,
  `dateto` DATE NULL,
  `dept` VARCHAR(100) NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `forliq` VARCHAR(100) NULL,
  `invdate` DATE NULL,
  `liqstat` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `parkdate` DATE NULL,
  `pono` VARCHAR(100) NULL,
  `postedby` VARCHAR(100) NULL,
  `recur` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `reflabel` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `replno` VARCHAR(100) NULL,
  `reprtcounter` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpbals` DECIMAL(18,4) NULL,
  `vpno2` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `formstbl` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `formtype` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `fundrepltbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `changeby` VARCHAR(100) NULL,
  `docnofr` VARCHAR(100) NULL,
  `docnoto` VARCHAR(100) NULL,
  `postingdate` DATE NULL,
  `remarks` TEXT NULL,
  `replno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totalamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entrytype` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvdettbl_update` (
  `acctno` VARCHAR(100) NULL,
  `astag` VARCHAR(100) NULL,
  `astagdate` DATETIME NULL,
  `astaguser` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entrytype` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `subaccttype` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `updatedate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vatstat` VARCHAR(100) NULL,
  `voidtransid` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvhdrtbl` (
  `apppostdate` DATETIME NULL,
  `branch` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dfrom` DATE NULL,
  `dramt` DECIMAL(18,4) NULL,
  `dto` DATE NULL,
  `entrytype` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `jvtype` VARCHAR(100) NULL,
  `postby` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `glmaintranstbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dateposted` DATETIME NULL,
  `dfrom` DATE NULL,
  `dramt` DECIMAL(18,4) NULL,
  `dto` DATE NULL,
  `entrytype` VARCHAR(100) NULL,
  `glstatus` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `jvtype` VARCHAR(100) NULL,
  `maingroup` VARCHAR(100) NULL,
  `monstat` VARCHAR(100) NULL,
  `motheracct` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `postedby` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `upperacct` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gltransmonstatus` (
  `audit1` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `dateaudit1` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `dfrom` DATE NULL,
  `dto` DATE NULL,
  `monstat` VARCHAR(100) NULL,
  `reopen` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearendcltype` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gltranstbl` (
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dateposted` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `drcr` VARCHAR(100) NULL,
  `glstatus` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `jvno` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `posttype` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vericheck` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invadjdettbl` (
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `stdqty` DECIMAL(18,4) NULL,
  `stdwt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invadjhdrtbl` (
  `dono` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invdetmontbl` (
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invdettbl` (
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `expdate` DATE NULL,
  `foh` DECIMAL(18,4) NULL,
  `inadjtqtybeg` VARCHAR(100) NULL,
  `inadjtwtbeg` VARCHAR(100) NULL,
  `initqtybeg` VARCHAR(100) NULL,
  `initwtbeg` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `prodqtybeg` VARCHAR(100) NULL,
  `prodwtbeg` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `recqtybeg` VARCHAR(100) NULL,
  `recwtbeg` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `uccos` VARCHAR(100) NULL,
  `ucstat` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vatvpamt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invhdrtbl` (
  `ba` VARCHAR(100) NULL,
  `bafrom` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `disposby` VARCHAR(100) NULL,
  `disposdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `formno` VARCHAR(100) NULL,
  `formtype` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `labstat` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mfgdate` DATE NULL,
  `mmrrno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `recvddate` DATE NULL,
  `remarks` TEXT NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `tactwt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `tqty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `twt` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invmmdettbl` (
  `codeno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issdettbl` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosamt` DECIMAL(18,4) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `idno` VARCHAR(100) NULL,
  `issby` VARCHAR(100) NULL,
  `issdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `issqtybeg` VARCHAR(100) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `isswtbeg` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `outadjtqtybeg` VARCHAR(100) NULL,
  `outadjtwtbeg` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issdettbl_update` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `updateid` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `isshdrtbl` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `checkedby` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `driver` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fgmmgrp` VARCHAR(100) NULL,
  `invdate` DATE NULL,
  `invno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mfgdate` DATE NULL,
  `mov` VARCHAR(100) NULL,
  `nosi` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdupdate` DATE NULL,
  `plateno` VARCHAR(100) NULL,
  `plntdest` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `produce` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `salesdoc` VARCHAR(100) NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `isshdrtbl_update` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `checkedby` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `driver` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fgmmgrp` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `nosi` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plateno` VARCHAR(100) NULL,
  `plntdest` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `updatedate` DATE NULL,
  `updateid` DATE NULL,
  `updatetype` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issscrpdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issscrphdrtbl` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lotnotbl` (
  `codeno` VARCHAR(100) NULL,
  `expirydate` DATE NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `lotno` VARCHAR(100) NULL,
  `noofbatch` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `prodtype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mmastprttbl` (
  `codeno` VARCHAR(100) NULL,
  `dcreate` DATETIME NULL,
  `mmdesc` VARCHAR(255) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mmasttbl` (
  `admdigit` VARCHAR(100) NULL,
  `basecodeno` VARCHAR(100) NULL,
  `basematl` VARCHAR(100) NULL,
  `bcodenogrp` VARCHAR(100) NULL,
  `billref` VARCHAR(100) NULL,
  `codename` VARCHAR(255) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosbillref` VARCHAR(100) NULL,
  `glacct` VARCHAR(100) NULL,
  `invlevel` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `maintype` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `packing` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `precodeno` VARCHAR(100) NULL,
  `produce` VARCHAR(100) NULL,
  `qtpk` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `trade` VARCHAR(100) NULL,
  `tradeonly` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ucdigit` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `wtfr` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `modtranstattbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `dateaudit1` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `dfrom` DATE NULL,
  `dto` DATE NULL,
  `monstat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `montranstbl` (
  `dto` DATE NULL,
  `transtype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `movplnttbl` (
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `movtbl` (
  `form` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `movdesc` VARCHAR(255) NULL,
  `soporeq` VARCHAR(100) NULL,
  `ttype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payadjttbl` (
  `adjtamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paycommtbl` (
  `empno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `totcomm` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paydeducttbl` (
  `basictax` VARCHAR(100) NULL,
  `basictaxamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `cashadvance` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `earnforcontn` VARCHAR(100) NULL,
  `ecc` DECIMAL(18,4) NULL,
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `excesstaxamt` DECIMAL(18,4) NULL,
  `grossearn` DECIMAL(18,4) NULL,
  `hdmfaddlprem` DECIMAL(18,4) NULL,
  `hdmfexp` VARCHAR(100) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `idno` VARCHAR(100) NULL,
  `monyear` VARCHAR(100) NULL,
  `mtdearncontn` VARCHAR(100) NULL,
  `mtdhdmf` VARCHAR(100) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `otherdeduct` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `sssexp` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `sysver` VARCHAR(100) NULL,
  `taxableamt` DECIMAL(18,4) NULL,
  `taxablegross` VARCHAR(100) NULL,
  `taxableupdate` DATE NULL,
  `taxdednfrearn` VARCHAR(100) NULL,
  `taxdue` DECIMAL(18,4) NULL,
  `taxrate` DECIMAL(18,4) NULL,
  `totaldeduct` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paydtrtbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `eq_hrs_late` VARCHAR(100) NULL,
  `eq_hrs_ut` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `in_rem` VARCHAR(100) NULL,
  `inam` VARCHAR(100) NULL,
  `out_rem` VARCHAR(100) NULL,
  `outpm` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `shiftcode2` VARCHAR(100) NULL,
  `stdin` VARCHAR(100) NULL,
  `stdout` VARCHAR(100) NULL,
  `terminam` VARCHAR(100) NULL,
  `tot_late_hrs` DECIMAL(18,4) NULL,
  `tot_ut_hrs` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payearnmasttbl` (
  `codeno` VARCHAR(100) NULL,
  `earndesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL,
  `type` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payearntbl` (
  `absent_amt` DECIMAL(18,4) NULL,
  `absent_hrs` DECIMAL(18,4) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `ca` VARCHAR(100) NULL,
  `cbond` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `comm_amt` DECIMAL(18,4) NULL,
  `elamt` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_amt` DATETIME NULL,
  `extratime_dhrs` DATETIME NULL,
  `hdmfhousloan` VARCHAR(100) NULL,
  `hdmfsalloan` VARCHAR(100) NULL,
  `holidayamt` DECIMAL(18,4) NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `hrrated` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `late_amt` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `monyear` VARCHAR(100) NULL,
  `nightdiffamt` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `otataxable` VARCHAR(100) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `othearn_amt` DECIMAL(18,4) NULL,
  `othrleaveamt` DECIMAL(18,4) NULL,
  `othrleavehrs` DECIMAL(18,4) NULL,
  `otime_amt` DATETIME NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `ratereg` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `regtime_amt` DATETIME NULL,
  `regtime_dhrs` DATETIME NULL,
  `remarks` TEXT NULL,
  `sl_amt` DECIMAL(18,4) NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `splotamt` DECIMAL(18,4) NULL,
  `splothrs` DECIMAL(18,4) NULL,
  `ssssalaryloan` VARCHAR(100) NULL,
  `taxablegross` VARCHAR(100) NULL,
  `telallow` VARCHAR(100) NULL,
  `totalearn` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transpoallow` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vl_amt` DECIMAL(18,4) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL,
  `web` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payemployeetbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `empstat` VARCHAR(100) NULL,
  `firstname` VARCHAR(255) NULL,
  `lastname` VARCHAR(255) NULL,
  `paytype` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payfintbl` (
  `basicpay` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ecc` DECIMAL(18,4) NULL,
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `hdmfaddlprem` DECIMAL(18,4) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `hrrate` DECIMAL(18,4) NULL,
  `hrrated` VARCHAR(100) NULL,
  `loadallow` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payidno` VARCHAR(100) NULL,
  `paymode` VARCHAR(100) NULL,
  `paystat` VARCHAR(100) NULL,
  `payto` DATE NULL,
  `paytype` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `transallow` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtbirannualtbl` (
  `basic` DECIMAL(18,4) NULL,
  `excesrate` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtbirtbl` (
  `basic` DECIMAL(18,4) NULL,
  `excempcode` VARCHAR(100) NULL,
  `excesrate` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL,
  `paytype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtphtbl` (
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL,
  `ratelabel` VARCHAR(100) NULL,
  `ratetype` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payidnostattbl` (
  `att` VARCHAR(100) NULL,
  `attdate` DATETIME NULL,
  `attuser` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `deduct` VARCHAR(100) NULL,
  `deductdate` DATETIME NULL,
  `deductuser` VARCHAR(100) NULL,
  `earn` VARCHAR(100) NULL,
  `earndate` DATETIME NULL,
  `earnuser` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `netdate` DATETIME NULL,
  `netuser` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payidtbl` (
  `codeno` VARCHAR(100) NULL,
  `commdate1` DATE NULL,
  `commdate2` DATE NULL,
  `datechngstat` DATETIME NULL,
  `datecreate` DATE NULL,
  `dateupdate` DATETIME NULL,
  `empno` VARCHAR(100) NULL,
  `idstat` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `monyear` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `paystat` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `pdatefr` DATE NULL,
  `pdateto` DATE NULL,
  `rate` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `userchngstat` VARCHAR(100) NULL,
  `userupdate` DATE NULL,
  `web` VARCHAR(100) NULL,
  `workdays` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payitemstbl` (
  `itemtype` VARCHAR(100) NULL,
  `itmgrp` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payitemdesc` VARCHAR(255) NULL,
  `tablefield1` VARCHAR(100) NULL,
  `tablefield2` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payitmccnotbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payloanmasttbl` (
  `amortamt` DECIMAL(18,4) NULL,
  `dateend` DATE NULL,
  `datestart` DATE NULL,
  `empno` VARCHAR(100) NULL,
  `loanamt` DECIMAL(18,4) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `loanstat` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `terms` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paymealallowtbl` (
  `empno` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payndifftbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `earnrate` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `ndamt` DECIMAL(18,4) NULL,
  `ndcode` VARCHAR(100) NULL,
  `ndhrs` DECIMAL(18,4) NULL,
  `ndrate` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payndratetbl` (
  `ndcode` VARCHAR(100) NULL,
  `nddesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payotdtbl` (
  `adjtamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payotearntbl` (
  `amt` DECIMAL(18,4) NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `rate` DECIMAL(18,4) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payothrloantbl` (
  `amt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paysliptbl` (
  `cbondytd` DECIMAL(18,4) NULL,
  `ccdesc` VARCHAR(255) NULL,
  `ccno` VARCHAR(100) NULL,
  `comm_amt` DECIMAL(18,4) NULL,
  `elamt` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_amt` DATETIME NULL,
  `extratime_dhrs` DATETIME NULL,
  `hdmfhausbal` DECIMAL(18,4) NULL,
  `hdmfsalbal` DECIMAL(18,4) NULL,
  `holidayamt` DECIMAL(18,4) NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `late_amt` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `nightdiffamt` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `othearn_amt` DECIMAL(18,4) NULL,
  `otime_amt` DATETIME NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `ratereg` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `regtime_amt` DATETIME NULL,
  `regtime_dhrs` DATETIME NULL,
  `sl_amt` DECIMAL(18,4) NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `ssssalbal` DECIMAL(18,4) NULL,
  `totalearn` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vl_amt` DECIMAL(18,4) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL,
  `web` VARCHAR(100) NULL,
  `ytdgross` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payvlslapptbl` (
  `dateendappr` DATE NULL,
  `datestartappr` DATE NULL,
  `daysappr` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `hrsappr` VARCHAR(100) NULL,
  `leaveamt` DECIMAL(18,4) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payvlsltbl` (
  `empno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pctrtbl` (
  `acctno` VARCHAR(100) NULL,
  `aracctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `ccadmin` VARCHAR(100) NULL,
  `cclogis` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccnoprod` VARCHAR(100) NULL,
  `ccprod` VARCHAR(100) NULL,
  `cctech` VARCHAR(100) NULL,
  `dsr` VARCHAR(100) NULL,
  `gldisc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pclass` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `tradetype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plnttbl` (
  `address` TEXT NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `fginv` VARCHAR(100) NULL,
  `fgrec` VARCHAR(100) NULL,
  `fgtrans` VARCHAR(100) NULL,
  `invset` VARCHAR(100) NULL,
  `ownertype` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `plntname` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `prodnplnt` VARCHAR(100) NULL,
  `rmcos` VARCHAR(100) NULL,
  `rminv` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `venno2` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plstreqtbl` (
  `areano` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currprc` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `effdate` DATE NULL,
  `oldsp` DECIMAL(18,4) NULL,
  `prvdate` DATE NULL,
  `reqstat` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plsttbl` (
  `codeno` VARCHAR(100) NULL,
  `currprc` DECIMAL(18,4) NULL,
  `drate` DECIMAL(18,4) NULL,
  `prvdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pmstocktbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `podettbl` (
  `amt` DECIMAL(18,4) NULL,
  `appqty` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `podettbl_update` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pohdrtbl` (
  `appby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currency` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `multiriv` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `podate` DATE NULL,
  `pono` VARCHAR(100) NULL,
  `poremarks` TEXT NULL,
  `postat` VARCHAR(100) NULL,
  `pototamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `rivno` VARCHAR(100) NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pohdrtbl_update` (
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currency` VARCHAR(100) NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `multiriv` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `postat` VARCHAR(100) NULL,
  `pototamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prodreqdettbl` (
  `codeno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `lotno` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `prodnstat` VARCHAR(100) NULL,
  `tardate` DATE NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prodreqhdrtbl` (
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prttbl` (
  `datereprt` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `reprtcounter` VARCHAR(100) NULL,
  `reprtstat` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `qryreqttbl` (
  `branch` VARCHAR(100) NULL,
  `createdby` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `reqname` VARCHAR(255) NULL,
  `reqtype` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `type1` VARCHAR(100) NULL,
  `type2` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reqsodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `prodreq` VARCHAR(100) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reqsohdrtbl` (
  `apprvdby` VARCHAR(100) NULL,
  `currbal` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `deldate` DATE NULL,
  `delstat` VARCHAR(100) NULL,
  `deposit` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdc` DECIMAL(18,4) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `soamt` DECIMAL(18,4) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `totar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rivdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `appamt` DECIMAL(18,4) NULL,
  `appqty` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `currinv` DECIMAL(18,4) NULL,
  `detstat` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `qtydel` DECIMAL(18,4) NULL,
  `rivno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rivhdrtbl` (
  `appby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `rivno` VARCHAR(100) NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `salesdettbl` (
  `acctno` VARCHAR(100) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dealstat` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmgrpdesc` VARCHAR(255) NULL,
  `nv` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `ucos` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `salesdettbl_update` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateid` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `saleshdrtbl` (
  `arflag` VARCHAR(100) NULL,
  `arflagdate` DATETIME NULL,
  `arflaguser` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `basecodeno` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fhamt` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `grossamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `otherbadoc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `postupdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `user2` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `saleshdrtbl_update` (
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fhamt` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `grossamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `otherbadoc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `postupdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `serverlogintbl` (
  `pcname` VARCHAR(255) NULL,
  `sysver` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `shrinkreporttbl` (
  `amqty` DECIMAL(18,4) NULL,
  `amstock` DECIMAL(18,4) NULL,
  `availablestck` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `doqty` DECIMAL(18,4) NULL,
  `dos` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `pcnt` DECIMAL(18,4) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty2` DECIMAL(18,4) NULL,
  `qty3` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `sales` DECIMAL(18,4) NULL,
  `shrinkage` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `varqty` DECIMAL(18,4) NULL,
  `wrr` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `signtbl` (
  `frmname` VARCHAR(255) NULL,
  `fullname` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `signtype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sloctbl` (
  `plntno` VARCHAR(100) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocdesc` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `smnmtbl` (
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `shrtname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `smntype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `issby` VARCHAR(100) NULL,
  `issdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `prodreq` VARCHAR(100) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sohdrtbl` (
  `apprdate` DATE NULL,
  `apprem` DECIMAL(18,4) NULL,
  `apprvdby` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `currbal` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `deldate` DATE NULL,
  `delstat` VARCHAR(100) NULL,
  `deposit` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdc` DECIMAL(18,4) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `soamt` DECIMAL(18,4) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `totar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `splpricetbl` (
  `custno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `subdoctbl` (
  `grpdoc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_forms` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `inused` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_mymenu` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `menudesc` VARCHAR(255) NULL,
  `menulabel` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_usergroup` (
  `ug_code` VARCHAR(100) NULL,
  `ug_name` VARCHAR(255) NULL,
  `ug_notes` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_usergrouprights` (
  `gr_deleterights` VARCHAR(100) NULL,
  `gr_editrights` VARCHAR(100) NULL,
  `gr_formcode` VARCHAR(100) NULL,
  `gr_groupcode` VARCHAR(100) NULL,
  `gr_insertrights` VARCHAR(100) NULL,
  `gr_releaserights` VARCHAR(100) NULL,
  `gr_viewrights` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_userrecords` (
  `empno` VARCHAR(100) NULL,
  `idstat` VARCHAR(100) NULL,
  `invchck` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pwhint` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `useremailaddress` VARCHAR(100) NULL,
  `userfullname` VARCHAR(255) NULL,
  `usergroup` VARCHAR(100) NULL,
  `userloc` VARCHAR(100) NULL,
  `username` VARCHAR(255) NULL,
  `usernotes` TEXT NULL,
  `userpassword` VARCHAR(100) NULL,
  `usertelno` VARCHAR(100) NULL,
  `verupdate` DATE NULL,
  `wfh` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tccodestbl` (
  `document` VARCHAR(100) NULL,
  `modlongname` VARCHAR(255) NULL,
  `module` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging` (
  `custname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `dep` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invno2` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc2` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging_` (
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `curr` VARCHAR(100) NULL,
  `custname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `datedue` DATE NULL,
  `days` DECIMAL(18,4) NULL,
  `dep` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging_or` (
  `curr` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `days` DECIMAL(18,4) NULL,
  `dep` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invno2` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc2` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempasp` (
  `amt` DECIMAL(18,4) NULL,
  `asp` DECIMAL(18,4) NULL,
  `avecos` DECIMAL(18,4) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmgrpdesc` VARCHAR(255) NULL,
  `pc` VARCHAR(100) NULL,
  `pclass` VARCHAR(100) NULL,
  `qtpk` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `uccos` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `varamt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostbl` (
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostingtbl` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosno` VARCHAR(100) NULL,
  `dlcost` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `totohamt` DECIMAL(18,4) NULL,
  `totrmamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostingtbl2` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcustbal` (
  `bussname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invbals` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `payment` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcvdettbl` (
  `dramt` DECIMAL(18,4) NULL,
  `itemno` VARCHAR(100) NULL,
  `tcref` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vpdate` DATE NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcwtdettbl` (
  `depapp` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `orno` VARCHAR(100) NULL,
  `pc2` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdmcmdetwebtbl` (
  `amt` DECIMAL(18,4) NULL,
  `docdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `stdqty` DECIMAL(18,4) NULL,
  `stdvar` DECIMAL(18,4) NULL,
  `stdwt` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet2` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet_` (
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodetprt` (
  `amount` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdsreport` (
  `amqty` DECIMAL(18,4) NULL,
  `amstock` DECIMAL(18,4) NULL,
  `availablestck` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `doqty` DECIMAL(18,4) NULL,
  `dos` DECIMAL(18,4) NULL,
  `netavail_qty` DECIMAL(18,4) NULL,
  `netavail_wt` DECIMAL(18,4) NULL,
  `pcnt` DECIMAL(18,4) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty2` DECIMAL(18,4) NULL,
  `qty3` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `sales` DECIMAL(18,4) NULL,
  `salesman` VARCHAR(255) NULL,
  `shrinkage` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `varqty` DECIMAL(18,4) NULL,
  `wrr` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdsrstck` (
  `codeno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexpdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `ewtbase` DECIMAL(18,4) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtrate` DECIMAL(18,4) NULL,
  `itemno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexphdrtbl` (
  `branch` VARCHAR(100) NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `payee` VARCHAR(255) NULL,
  `remarks` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexpsumtbl` (
  `datechange` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `expl` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempfgcostingtbl` (
  `asp` DECIMAL(18,4) NULL,
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `ucos` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgledit` (
  `balamt` DECIMAL(18,4) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgljvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgljvtbl` (
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `jvno3` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempglmaintbl` (
  `acctdesc` VARCHAR(255) NULL,
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `begamt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgltranstbl` (
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvbals` (
  `codeno` VARCHAR(100) NULL,
  `etadate` DATE NULL,
  `expdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `recqty` DECIMAL(18,4) NULL,
  `recwt` DECIMAL(18,4) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wrrwt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvbalsnew_` (
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qtybalbeg` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wtbalbeg` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `expdate` DATE NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvtbl` (
  `codeno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qty_bal` DECIMAL(18,4) NULL,
  `qty_in` VARCHAR(100) NULL,
  `qty_out` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt_bal` DECIMAL(18,4) NULL,
  `wt_in` VARCHAR(100) NULL,
  `wt_out` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvtbl2` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `costamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty_bal` DECIMAL(18,4) NULL,
  `qty_in` VARCHAR(100) NULL,
  `qty_out` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt_bal` DECIMAL(18,4) NULL,
  `wt_in` VARCHAR(100) NULL,
  `wt_out` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempissdettbl` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempisshdrtbl` (
  `dono` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `templotnotbl` (
  `codeno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `note` TEXT NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempmodstattbl` (
  `audit1` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `jvno` VARCHAR(100) NULL,
  `modname` VARCHAR(255) NULL,
  `refno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayadjt` (
  `adjtamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `mainidno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaycommtbl` (
  `autoamt` DECIMAL(18,4) NULL,
  `commadjt` DECIMAL(18,4) NULL,
  `empname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `totcomm` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaydeno` (
  `b100` DECIMAL(18,4) NULL,
  `b1000` DECIMAL(18,4) NULL,
  `b1000amt` DECIMAL(18,4) NULL,
  `b1000excess` DECIMAL(18,4) NULL,
  `b100amt` DECIMAL(18,4) NULL,
  `b100excess` DECIMAL(18,4) NULL,
  `b20` DECIMAL(18,4) NULL,
  `b200` DECIMAL(18,4) NULL,
  `b200amt` DECIMAL(18,4) NULL,
  `b200excess` DECIMAL(18,4) NULL,
  `b20amt` DECIMAL(18,4) NULL,
  `b20excess` DECIMAL(18,4) NULL,
  `b50` DECIMAL(18,4) NULL,
  `b500` DECIMAL(18,4) NULL,
  `b500amt` DECIMAL(18,4) NULL,
  `b500excess` DECIMAL(18,4) NULL,
  `b50amt` DECIMAL(18,4) NULL,
  `b50excess` DECIMAL(18,4) NULL,
  `c1` DECIMAL(18,4) NULL,
  `c10` DECIMAL(18,4) NULL,
  `c10amt` DECIMAL(18,4) NULL,
  `c10excess` DECIMAL(18,4) NULL,
  `c1amt` DECIMAL(18,4) NULL,
  `c1excess` DECIMAL(18,4) NULL,
  `c5` DECIMAL(18,4) NULL,
  `c5amt` DECIMAL(18,4) NULL,
  `c5excess` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayearntbl` (
  `absent_hrs` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empfullname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_dhrs` DATETIME NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `othrleavehrs` DECIMAL(18,4) NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `regtime_dhrs` DATETIME NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayloansalltbl` (
  `bank11` VARCHAR(100) NULL,
  `bank12` VARCHAR(100) NULL,
  `ca1` VARCHAR(100) NULL,
  `ca2` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hdmfhse1` VARCHAR(100) NULL,
  `hdmfhse2` VARCHAR(100) NULL,
  `hdmfsal1` VARCHAR(100) NULL,
  `hdmfsal2` VARCHAR(100) NULL,
  `othr3` VARCHAR(100) NULL,
  `ssscal1` VARCHAR(100) NULL,
  `ssscal2` VARCHAR(100) NULL,
  `ssssal1` VARCHAR(100) NULL,
  `ssssal2` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayndifftbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `ndcode` VARCHAR(100) NULL,
  `ndhrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayotd` (
  `adjtamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `loanrefno` VARCHAR(100) NULL,
  `mainidno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayotearntbl` (
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayothrloantbl` (
  `deductamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `loanamt` DECIMAL(18,4) NULL,
  `loanbalamt` DECIMAL(18,4) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaypcgrptbl` (
  `empno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaytaxannual` (
  `basictax` VARCHAR(100) NULL,
  `basictaxamt` DECIMAL(18,4) NULL,
  `earngross` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `excesstaxamt` DECIMAL(18,4) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `nettaxableinc` DECIMAL(18,4) NULL,
  `nettaxdue` DECIMAL(18,4) NULL,
  `otataxable` VARCHAR(100) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `taxableamtytd` DECIMAL(18,4) NULL,
  `taxdue` DECIMAL(18,4) NULL,
  `taxrate` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayvlsltbl` (
  `begel` DECIMAL(18,4) NULL,
  `begsl` DECIMAL(18,4) NULL,
  `begvl` DECIMAL(18,4) NULL,
  `elbals` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `slbals` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `vlbals` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempplnttbl` (
  `plntno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temprivdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `currinv` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsalesdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsalesdettbl2` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `translog` (
  `datetimelog` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `form` VARCHAR(100) NULL,
  `pcipadd` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `trans` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `updatetbl` (
  `dateupdate` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `origname` VARCHAR(255) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `update_dateonly` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `userplnttbl` (
  `plntno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `venmasttbl` (
  `address` TEXT NULL,
  `address2` TEXT NULL,
  `branch` VARCHAR(100) NULL,
  `cgtype` VARCHAR(100) NULL,
  `chname` VARCHAR(255) NULL,
  `conper` VARCHAR(100) NULL,
  `cotype` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datechange` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `emailadd` VARCHAR(100) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `mmrrreq` VARCHAR(100) NULL,
  `pcfcust` VARCHAR(100) NULL,
  `poreq` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `telno` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `tin2` VARCHAR(100) NULL,
  `tin3` VARCHAR(100) NULL,
  `tin4` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `venname` VARCHAR(255) NULL,
  `venno` VARCHAR(100) NULL,
  `ventype` VARCHAR(100) NULL,
  `ventype2` VARCHAR(100) NULL,
  `whtax` VARCHAR(100) NULL,
  `zip1` VARCHAR(100) NULL,
  `zip2` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `voidreqtbl` (
  `appby` VARCHAR(100) NULL,
  `appdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `remarks` TEXT NULL,
  `reqstat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vdocno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wipdettbl` (
  `codeno` VARCHAR(100) NULL,
  `datepost` DATETIME NULL,
  `dono` VARCHAR(100) NULL,
  `dprno` VARCHAR(100) NULL,
  `fgtype` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `liqrepno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `source` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `stdcosamt` DECIMAL(18,4) NULL,
  `stduc` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ucstat` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wipno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wrrdettbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wrrno` VARCHAR(100) NULL,
  `wrrqtybeg` VARCHAR(100) NULL,
  `wrrwtbeg` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wrrhdrtbl` (
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `wrrno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `batbl` (`ba`, `bussname`) SELECT * FROM (SELECT '8100' a, 'JCS Chemical Industries, Inc.' b UNION ALL SELECT '8200', 'APF Corporation' UNION ALL SELECT '8300', 'Chemag Trading Corporation') x WHERE NOT EXISTS (SELECT 1 FROM `batbl`);

CREATE DATABASE IF NOT EXISTS `chemag` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `chemag`;

CREATE TABLE IF NOT EXISTS `acctcharttbl` (
  `acctdesc` VARCHAR(255) NULL,
  `acctno` VARCHAR(100) NULL,
  `acctno2` VARCHAR(100) NULL,
  `acctnopre` VARCHAR(100) NULL,
  `baxchrgs` VARCHAR(100) NULL,
  `cv` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `invcos` VARCHAR(100) NULL,
  `maingroup` VARCHAR(100) NULL,
  `motheracct` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `taxitm` VARCHAR(100) NULL,
  `upperacct` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `amstocktbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `areatbl` (
  `areaname` VARCHAR(255) NULL,
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `covarea` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `authtbl` (
  `appstat` VARCHAR(100) NULL,
  `form` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `maxamt` DECIMAL(18,4) NULL,
  `module` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bankdepdettbl` (
  `acctno` VARCHAR(100) NULL,
  `cashamt` DECIMAL(18,4) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `checkamt` DECIMAL(18,4) NULL,
  `depno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bankdephdrtbl` (
  `branch` VARCHAR(100) NULL,
  `depno` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `banktbl` (
  `acctno` VARCHAR(100) NULL,
  `accttype` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bankname` VARCHAR(255) NULL,
  `chprefix` VARCHAR(100) NULL,
  `chsize` VARCHAR(100) NULL,
  `depository` VARCHAR(100) NULL,
  `owner` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `batbl` (
  `add_birform` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `apprvdby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bir_sign` VARCHAR(100) NULL,
  `bir_sign_poss` VARCHAR(100) NULL,
  `bir_sign_tin` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `ccadmin` VARCHAR(100) NULL,
  `cclogis` VARCHAR(100) NULL,
  `ccprod` VARCHAR(100) NULL,
  `ccsales` VARCHAR(100) NULL,
  `cctech` VARCHAR(100) NULL,
  `cdcrproc` VARCHAR(100) NULL,
  `cotin1` VARCHAR(100) NULL,
  `cotin2` VARCHAR(100) NULL,
  `cotin3` VARCHAR(100) NULL,
  `cotin4` VARCHAR(100) NULL,
  `dloadstat` VARCHAR(100) NULL,
  `hmdfcon15` VARCHAR(100) NULL,
  `hmdfcon30` VARCHAR(100) NULL,
  `hmdfconw1` VARCHAR(100) NULL,
  `hmdfconw2` VARCHAR(100) NULL,
  `hmdfconw3` VARCHAR(100) NULL,
  `hmdfconw4` VARCHAR(100) NULL,
  `nonexps` VARCHAR(100) NULL,
  `notedby` VARCHAR(100) NULL,
  `ph_max` VARCHAR(100) NULL,
  `ph_mid` VARCHAR(100) NULL,
  `ph_min` VARCHAR(100) NULL,
  `ph_rate` DECIMAL(18,4) NULL,
  `phcon15` VARCHAR(100) NULL,
  `phcon30` VARCHAR(100) NULL,
  `phconw1` VARCHAR(100) NULL,
  `phconw2` VARCHAR(100) NULL,
  `phconw3` VARCHAR(100) NULL,
  `phconw4` VARCHAR(100) NULL,
  `poapprby` VARCHAR(100) NULL,
  `server_note` TEXT NULL,
  `shrtname` VARCHAR(255) NULL,
  `ssscon15` VARCHAR(100) NULL,
  `ssscon30` VARCHAR(100) NULL,
  `sssconw1` VARCHAR(100) NULL,
  `sssconw2` VARCHAR(100) NULL,
  `sssconw3` VARCHAR(100) NULL,
  `sssconw4` VARCHAR(100) NULL,
  `ssstable` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `taxextra` VARCHAR(100) NULL,
  `zip` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bir_ewttbl` (
  `cotype` VARCHAR(100) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtdesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `buddettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `datefr` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cctrnotbl` (
  `acctnopre` VARCHAR(100) NULL,
  `amt` DECIMAL(18,4) NULL,
  `attsource` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `brcode` VARCHAR(100) NULL,
  `budccno` VARCHAR(100) NULL,
  `ccdesc` VARCHAR(255) NULL,
  `ccdesc2` VARCHAR(255) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `ccnogrp` VARCHAR(100) NULL,
  `cosexp` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `prodgrp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cdcrtbl` (
  `branch` VARCHAR(100) NULL,
  `cashamt` DECIMAL(18,4) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `checkamt` DECIMAL(18,4) NULL,
  `depno` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `onlineamt` DECIMAL(18,4) NULL,
  `pdcamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cgbatchtbl` (
  `batchno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vp_no` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `coldettbl` (
  `branch` VARCHAR(100) NULL,
  `coltype` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `daitmno` VARCHAR(100) NULL,
  `depapp` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `netcolamt` DECIMAL(18,4) NULL,
  `oramt` DECIMAL(18,4) NULL,
  `origamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `orno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `colhdrtbl` (
  `areano` VARCHAR(100) NULL,
  `bank` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `cdcrno` VARCHAR(100) NULL,
  `cdcrstat` VARCHAR(100) NULL,
  `cheqstat` VARCHAR(100) NULL,
  `chno` VARCHAR(100) NULL,
  `colamt` DECIMAL(18,4) NULL,
  `coldate` DATE NULL,
  `coltype` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `ewtrem` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `origcustno` VARCHAR(100) NULL,
  `orno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `remarks` TEXT NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `valstat` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cosdettbl` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosno` VARCHAR(100) NULL,
  `dlcost` DECIMAL(18,4) NULL,
  `dlkg` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `ohkg` DECIMAL(18,4) NULL,
  `packcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `coshdrtbl` (
  `cosno` VARCHAR(100) NULL,
  `glstat` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cosinvtbl` (
  `codeno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `currencytbl` (
  `currency` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custdmcmdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cmamt` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `ewtform` VARCHAR(100) NULL,
  `glacct1` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custdmcmhdrtbl` (
  `apprvdby` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `glstat` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `reasons` TEXT NULL,
  `remarks` TEXT NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmasttbl` (
  `accttype` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `areano` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `busstype` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `contactno` VARCHAR(100) NULL,
  `crlimit` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `custnofrom` VARCHAR(100) NULL,
  `custtype` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datechange` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `discopt` VARCHAR(100) NULL,
  `drbiropt` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `fname` VARCHAR(255) NULL,
  `moacctno` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `prevmoacctno` VARCHAR(100) NULL,
  `searchname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmasttbl_update` (
  `accttype` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `areano` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `busstype` VARCHAR(100) NULL,
  `contactno` VARCHAR(100) NULL,
  `crlimit` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `custnofrom` VARCHAR(100) NULL,
  `custtype` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `disc` VARCHAR(100) NULL,
  `discopt` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `fname` VARCHAR(255) NULL,
  `lotopt` VARCHAR(100) NULL,
  `lotpref` VARCHAR(100) NULL,
  `moacctno` VARCHAR(100) NULL,
  `oldno` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `prevmoacctno` VARCHAR(100) NULL,
  `saveloan` VARCHAR(100) NULL,
  `searchname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `updatetype` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `custmmtbl` (
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entryfr` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tcref` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vpdate` DATE NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cvhdrtbl` (
  `ba` VARCHAR(100) NULL,
  `bank` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `chdate` DATE NULL,
  `chno` VARCHAR(100) NULL,
  `chsize` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `payeename` VARCHAR(255) NULL,
  `payeetype` VARCHAR(100) NULL,
  `postingdate` DATE NULL,
  `refdoc` VARCHAR(100) NULL,
  `reldate` DATE NULL,
  `relstat` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `delmontbl` (
  `docno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `depapptbl` (
  `actdocno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `netcolamt` DECIMAL(18,4) NULL,
  `note` TEXT NULL,
  `oramt` DECIMAL(18,4) NULL,
  `ordate` DATE NULL,
  `orno` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `savestat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `depttbl` (
  `appby1` VARCHAR(100) NULL,
  `appby2` VARCHAR(100) NULL,
  `appby3` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `dept` VARCHAR(100) NULL,
  `deptname` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `doclocktbl` (
  `docno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `stat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `dsrnotbl` (
  `branch` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrno_amstock` VARCHAR(100) NULL,
  `exceprep` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `olddsrno` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc62amt` DECIMAL(18,4) NULL,
  `tc84amt` DECIMAL(18,4) NULL,
  `tc85amt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `expdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `datechange` DATETIME NULL,
  `depstat` VARCHAR(100) NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entryfr` VARCHAR(100) NULL,
  `ewtbase` DECIMAL(18,4) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtrate` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `itemno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `remarksline` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `updateby` DATE NULL,
  `venno` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `exphdrtbl` (
  `amortamt` DECIMAL(18,4) NULL,
  `auditby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `caend` VARCHAR(100) NULL,
  `caseq` VARCHAR(100) NULL,
  `castart` VARCHAR(100) NULL,
  `caterms` VARCHAR(100) NULL,
  `cvby` VARCHAR(100) NULL,
  `cvdate` DATE NULL,
  `cvno` VARCHAR(100) NULL,
  `cvstat` VARCHAR(100) NULL,
  `dateaudit` DATETIME NULL,
  `datechange` DATETIME NULL,
  `datefr` DATE NULL,
  `datepost` DATETIME NULL,
  `dateto` DATE NULL,
  `dept` VARCHAR(100) NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `forliq` VARCHAR(100) NULL,
  `invdate` DATE NULL,
  `liqstat` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `parkdate` DATE NULL,
  `pono` VARCHAR(100) NULL,
  `postedby` VARCHAR(100) NULL,
  `recur` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `reflabel` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `replno` VARCHAR(100) NULL,
  `reprtcounter` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpbals` DECIMAL(18,4) NULL,
  `vpno2` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `webapp` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `formstbl` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `formtype` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `fundrepltbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `changeby` VARCHAR(100) NULL,
  `docnofr` VARCHAR(100) NULL,
  `docnoto` VARCHAR(100) NULL,
  `postingdate` DATE NULL,
  `remarks` TEXT NULL,
  `replno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totalamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entrytype` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvdettbl_update` (
  `acctno` VARCHAR(100) NULL,
  `astag` VARCHAR(100) NULL,
  `astagdate` DATETIME NULL,
  `astaguser` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `entrytype` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `subaccttype` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `updatedate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vatstat` VARCHAR(100) NULL,
  `voidtransid` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gljvhdrtbl` (
  `apppostdate` DATETIME NULL,
  `branch` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dfrom` DATE NULL,
  `dramt` DECIMAL(18,4) NULL,
  `dto` DATE NULL,
  `entrytype` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `jvtype` VARCHAR(100) NULL,
  `postby` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `sourcedoc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `glmaintranstbl` (
  `acctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dateposted` DATETIME NULL,
  `dfrom` DATE NULL,
  `dramt` DECIMAL(18,4) NULL,
  `dto` DATE NULL,
  `entrytype` VARCHAR(100) NULL,
  `glstatus` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `jvno` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `jvtype` VARCHAR(100) NULL,
  `maingroup` VARCHAR(100) NULL,
  `monstat` VARCHAR(100) NULL,
  `motheracct` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `postedby` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `upperacct` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearend` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gltransmonstatus` (
  `audit1` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `dateaudit1` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `dfrom` DATE NULL,
  `dto` DATE NULL,
  `monstat` VARCHAR(100) NULL,
  `reopen` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearendcltype` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `gltranstbl` (
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cos` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dateposted` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `drcr` VARCHAR(100) NULL,
  `glstatus` VARCHAR(100) NULL,
  `grpacct` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `jvno` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `posttype` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vericheck` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invadjdettbl` (
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `stdqty` DECIMAL(18,4) NULL,
  `stdwt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invadjhdrtbl` (
  `dono` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invdetmontbl` (
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invdettbl` (
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `expdate` DATE NULL,
  `foh` DECIMAL(18,4) NULL,
  `inadjtqtybeg` VARCHAR(100) NULL,
  `inadjtwtbeg` VARCHAR(100) NULL,
  `initqtybeg` VARCHAR(100) NULL,
  `initwtbeg` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `prodqtybeg` VARCHAR(100) NULL,
  `prodwtbeg` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `recqtybeg` VARCHAR(100) NULL,
  `recwtbeg` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `uccos` VARCHAR(100) NULL,
  `ucstat` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vatvpamt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invhdrtbl` (
  `ba` VARCHAR(100) NULL,
  `bafrom` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `disposby` VARCHAR(100) NULL,
  `disposdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `formno` VARCHAR(100) NULL,
  `formtype` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `labstat` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mfgdate` DATE NULL,
  `mmrrno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `recvddate` DATE NULL,
  `remarks` TEXT NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `tactwt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `tqty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `twt` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `vpno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invmmdettbl` (
  `codeno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issdettbl` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosamt` DECIMAL(18,4) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `idno` VARCHAR(100) NULL,
  `issby` VARCHAR(100) NULL,
  `issdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `issqtybeg` VARCHAR(100) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `isswtbeg` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `outadjtqtybeg` VARCHAR(100) NULL,
  `outadjtwtbeg` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issdettbl_update` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `updateid` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `isshdrtbl` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `batchno` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `checkedby` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `driver` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fgmmgrp` VARCHAR(100) NULL,
  `invdate` DATE NULL,
  `invno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mfgdate` DATE NULL,
  `mov` VARCHAR(100) NULL,
  `nosi` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdupdate` DATE NULL,
  `plateno` VARCHAR(100) NULL,
  `plntdest` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `produce` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `salesdoc` VARCHAR(100) NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `isshdrtbl_update` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `checkedby` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `driver` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fgmmgrp` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `nosi` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plateno` VARCHAR(100) NULL,
  `plntdest` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `updatedate` DATE NULL,
  `updateid` DATE NULL,
  `updatetype` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issscrpdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `issscrphdrtbl` (
  `ba` VARCHAR(100) NULL,
  `badest` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ttype` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lotnotbl` (
  `codeno` VARCHAR(100) NULL,
  `expirydate` DATE NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `lotno` VARCHAR(100) NULL,
  `noofbatch` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `prodtype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mmastprttbl` (
  `codeno` VARCHAR(100) NULL,
  `dcreate` DATETIME NULL,
  `mmdesc` VARCHAR(255) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mmasttbl` (
  `admdigit` VARCHAR(100) NULL,
  `basecodeno` VARCHAR(100) NULL,
  `basematl` VARCHAR(100) NULL,
  `bcodenogrp` VARCHAR(100) NULL,
  `billref` VARCHAR(100) NULL,
  `codename` VARCHAR(255) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosbillref` VARCHAR(100) NULL,
  `glacct` VARCHAR(100) NULL,
  `invlevel` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `maintype` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `packing` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `precodeno` VARCHAR(100) NULL,
  `produce` VARCHAR(100) NULL,
  `qtpk` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `trade` VARCHAR(100) NULL,
  `tradeonly` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ucdigit` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `wtfr` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `modtranstattbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `dateaudit1` DATETIME NULL,
  `datecreated` DATETIME NULL,
  `dfrom` DATE NULL,
  `dto` DATE NULL,
  `monstat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transmon` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `yearstat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `montranstbl` (
  `dto` DATE NULL,
  `transtype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `movplnttbl` (
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `movtbl` (
  `form` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `movdesc` VARCHAR(255) NULL,
  `soporeq` VARCHAR(100) NULL,
  `ttype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payadjttbl` (
  `adjtamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paycommtbl` (
  `empno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `totcomm` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paydeducttbl` (
  `basictax` VARCHAR(100) NULL,
  `basictaxamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `cashadvance` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `earnforcontn` VARCHAR(100) NULL,
  `ecc` DECIMAL(18,4) NULL,
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `excesstaxamt` DECIMAL(18,4) NULL,
  `grossearn` DECIMAL(18,4) NULL,
  `hdmfaddlprem` DECIMAL(18,4) NULL,
  `hdmfexp` VARCHAR(100) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `idno` VARCHAR(100) NULL,
  `monyear` VARCHAR(100) NULL,
  `mtdearncontn` VARCHAR(100) NULL,
  `mtdhdmf` VARCHAR(100) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `otherdeduct` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `sssexp` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `sysver` VARCHAR(100) NULL,
  `taxableamt` DECIMAL(18,4) NULL,
  `taxablegross` VARCHAR(100) NULL,
  `taxableupdate` DATE NULL,
  `taxdednfrearn` VARCHAR(100) NULL,
  `taxdue` DECIMAL(18,4) NULL,
  `taxrate` DECIMAL(18,4) NULL,
  `totaldeduct` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paydtrtbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `eq_hrs_late` VARCHAR(100) NULL,
  `eq_hrs_ut` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `in_rem` VARCHAR(100) NULL,
  `inam` VARCHAR(100) NULL,
  `out_rem` VARCHAR(100) NULL,
  `outpm` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `shiftcode2` VARCHAR(100) NULL,
  `stdin` VARCHAR(100) NULL,
  `stdout` VARCHAR(100) NULL,
  `terminam` VARCHAR(100) NULL,
  `tot_late_hrs` DECIMAL(18,4) NULL,
  `tot_ut_hrs` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payearnmasttbl` (
  `codeno` VARCHAR(100) NULL,
  `earndesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL,
  `type` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payearntbl` (
  `absent_amt` DECIMAL(18,4) NULL,
  `absent_hrs` DECIMAL(18,4) NULL,
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `ca` VARCHAR(100) NULL,
  `cbond` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `comm_amt` DECIMAL(18,4) NULL,
  `elamt` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_amt` DATETIME NULL,
  `extratime_dhrs` DATETIME NULL,
  `hdmfhousloan` VARCHAR(100) NULL,
  `hdmfsalloan` VARCHAR(100) NULL,
  `holidayamt` DECIMAL(18,4) NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `hrrated` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `late_amt` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `monyear` VARCHAR(100) NULL,
  `nightdiffamt` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `otataxable` VARCHAR(100) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `othearn_amt` DECIMAL(18,4) NULL,
  `othrleaveamt` DECIMAL(18,4) NULL,
  `othrleavehrs` DECIMAL(18,4) NULL,
  `otime_amt` DATETIME NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `ratereg` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `regtime_amt` DATETIME NULL,
  `regtime_dhrs` DATETIME NULL,
  `remarks` TEXT NULL,
  `sl_amt` DECIMAL(18,4) NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `splotamt` DECIMAL(18,4) NULL,
  `splothrs` DECIMAL(18,4) NULL,
  `ssssalaryloan` VARCHAR(100) NULL,
  `taxablegross` VARCHAR(100) NULL,
  `telallow` VARCHAR(100) NULL,
  `totalearn` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transpoallow` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vl_amt` DECIMAL(18,4) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL,
  `web` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payemployeetbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `empstat` VARCHAR(100) NULL,
  `firstname` VARCHAR(255) NULL,
  `lastname` VARCHAR(255) NULL,
  `paytype` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payfintbl` (
  `basicpay` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ecc` DECIMAL(18,4) NULL,
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `hdmfaddlprem` DECIMAL(18,4) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `hrrate` DECIMAL(18,4) NULL,
  `hrrated` VARCHAR(100) NULL,
  `loadallow` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payidno` VARCHAR(100) NULL,
  `paymode` VARCHAR(100) NULL,
  `paystat` VARCHAR(100) NULL,
  `payto` DATE NULL,
  `paytype` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `transallow` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtbirannualtbl` (
  `basic` DECIMAL(18,4) NULL,
  `excesrate` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtbirtbl` (
  `basic` DECIMAL(18,4) NULL,
  `excempcode` VARCHAR(100) NULL,
  `excesrate` DECIMAL(18,4) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL,
  `paytype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paygovtphtbl` (
  `emp` DECIMAL(18,4) NULL,
  `empexp` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `payfrom` DATE NULL,
  `payto` DATE NULL,
  `ratelabel` VARCHAR(100) NULL,
  `ratetype` VARCHAR(100) NULL,
  `sssprem` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payidnostattbl` (
  `att` VARCHAR(100) NULL,
  `attdate` DATETIME NULL,
  `attuser` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `deduct` VARCHAR(100) NULL,
  `deductdate` DATETIME NULL,
  `deductuser` VARCHAR(100) NULL,
  `earn` VARCHAR(100) NULL,
  `earndate` DATETIME NULL,
  `earnuser` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `netdate` DATETIME NULL,
  `netuser` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payidtbl` (
  `codeno` VARCHAR(100) NULL,
  `commdate1` DATE NULL,
  `commdate2` DATE NULL,
  `datechngstat` DATETIME NULL,
  `datecreate` DATE NULL,
  `dateupdate` DATETIME NULL,
  `empno` VARCHAR(100) NULL,
  `idstat` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `monyear` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `paystat` VARCHAR(100) NULL,
  `paytype` VARCHAR(100) NULL,
  `pdatefr` DATE NULL,
  `pdateto` DATE NULL,
  `rate` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `userchngstat` VARCHAR(100) NULL,
  `userupdate` DATE NULL,
  `web` VARCHAR(100) NULL,
  `workdays` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payitemstbl` (
  `itemtype` VARCHAR(100) NULL,
  `itmgrp` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payitemdesc` VARCHAR(255) NULL,
  `tablefield1` VARCHAR(100) NULL,
  `tablefield2` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payitmccnotbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payloanmasttbl` (
  `amortamt` DECIMAL(18,4) NULL,
  `dateend` DATE NULL,
  `datestart` DATE NULL,
  `empno` VARCHAR(100) NULL,
  `loanamt` DECIMAL(18,4) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `loanstat` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payseq` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `terms` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paymealallowtbl` (
  `empno` VARCHAR(100) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payndifftbl` (
  `ba` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `earnrate` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `ndamt` DECIMAL(18,4) NULL,
  `ndcode` VARCHAR(100) NULL,
  `ndhrs` DECIMAL(18,4) NULL,
  `ndrate` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payndratetbl` (
  `ndcode` VARCHAR(100) NULL,
  `nddesc` VARCHAR(255) NULL,
  `rate` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payotdtbl` (
  `adjtamt` DECIMAL(18,4) NULL,
  `branch` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payotearntbl` (
  `amt` DECIMAL(18,4) NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `rate` DECIMAL(18,4) NULL,
  `rateperhr` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payothrloantbl` (
  `amt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `paysliptbl` (
  `cbondytd` DECIMAL(18,4) NULL,
  `ccdesc` VARCHAR(255) NULL,
  `ccno` VARCHAR(100) NULL,
  `comm_amt` DECIMAL(18,4) NULL,
  `elamt` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_amt` DATETIME NULL,
  `extratime_dhrs` DATETIME NULL,
  `hdmfhausbal` DECIMAL(18,4) NULL,
  `hdmfsalbal` DECIMAL(18,4) NULL,
  `holidayamt` DECIMAL(18,4) NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `late_amt` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `mealallow` DECIMAL(18,4) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `nightdiffamt` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `othearn_amt` DECIMAL(18,4) NULL,
  `otime_amt` DATETIME NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `ratereg` DECIMAL(18,4) NULL,
  `ratetype` VARCHAR(100) NULL,
  `regtime_amt` DATETIME NULL,
  `regtime_dhrs` DATETIME NULL,
  `sl_amt` DECIMAL(18,4) NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `ssssalbal` DECIMAL(18,4) NULL,
  `totalearn` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vl_amt` DECIMAL(18,4) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL,
  `web` VARCHAR(100) NULL,
  `ytdgross` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payvlslapptbl` (
  `dateendappr` DATE NULL,
  `datestartappr` DATE NULL,
  `daysappr` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `hrsappr` VARCHAR(100) NULL,
  `leaveamt` DECIMAL(18,4) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `year` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payvlsltbl` (
  `empno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pctrtbl` (
  `acctno` VARCHAR(100) NULL,
  `aracctno` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `ccadmin` VARCHAR(100) NULL,
  `cclogis` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccnoprod` VARCHAR(100) NULL,
  `ccprod` VARCHAR(100) NULL,
  `cctech` VARCHAR(100) NULL,
  `dsr` VARCHAR(100) NULL,
  `gldisc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pclass` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `tradetype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plnttbl` (
  `address` TEXT NULL,
  `ba` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `ccno2` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `fginv` VARCHAR(100) NULL,
  `fgrec` VARCHAR(100) NULL,
  `fgtrans` VARCHAR(100) NULL,
  `invset` VARCHAR(100) NULL,
  `ownertype` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `plntname` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `prodnplnt` VARCHAR(100) NULL,
  `rmcos` VARCHAR(100) NULL,
  `rminv` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `venno2` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plstreqtbl` (
  `areano` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currprc` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `effdate` DATE NULL,
  `oldsp` DECIMAL(18,4) NULL,
  `prvdate` DATE NULL,
  `reqstat` VARCHAR(100) NULL,
  `sptype` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plsttbl` (
  `codeno` VARCHAR(100) NULL,
  `currprc` DECIMAL(18,4) NULL,
  `drate` DECIMAL(18,4) NULL,
  `prvdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pmstocktbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `podettbl` (
  `amt` DECIMAL(18,4) NULL,
  `appqty` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `podettbl_update` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pohdrtbl` (
  `appby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currency` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `multiriv` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `podate` DATE NULL,
  `pono` VARCHAR(100) NULL,
  `poremarks` TEXT NULL,
  `postat` VARCHAR(100) NULL,
  `pototamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `rivno` VARCHAR(100) NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pohdrtbl_update` (
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `branchto` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currency` VARCHAR(100) NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `multiriv` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `postat` VARCHAR(100) NULL,
  `pototamt` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prodreqdettbl` (
  `codeno` VARCHAR(100) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `lotno` VARCHAR(100) NULL,
  `prno` VARCHAR(100) NULL,
  `prodnstat` VARCHAR(100) NULL,
  `tardate` DATE NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prodreqhdrtbl` (
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prttbl` (
  `datereprt` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `reprtcounter` VARCHAR(100) NULL,
  `reprtstat` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `qryreqttbl` (
  `branch` VARCHAR(100) NULL,
  `createdby` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `reqname` VARCHAR(255) NULL,
  `reqtype` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `type1` VARCHAR(100) NULL,
  `type2` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reqsodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `prodreq` VARCHAR(100) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reqsohdrtbl` (
  `apprvdby` VARCHAR(100) NULL,
  `currbal` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `deldate` DATE NULL,
  `delstat` VARCHAR(100) NULL,
  `deposit` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdc` DECIMAL(18,4) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `soamt` DECIMAL(18,4) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `totar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rivdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `appamt` DECIMAL(18,4) NULL,
  `appqty` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `currinv` DECIMAL(18,4) NULL,
  `detstat` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `qtydel` DECIMAL(18,4) NULL,
  `rivno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rivhdrtbl` (
  `appby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `dateapp` DATETIME NULL,
  `datereq` DATE NULL,
  `dateupdate` DATETIME NULL,
  `dept` VARCHAR(100) NULL,
  `mmtype` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `rivno` VARCHAR(100) NULL,
  `servstat` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `salesdettbl` (
  `acctno` VARCHAR(100) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `dealstat` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmgrpdesc` VARCHAR(255) NULL,
  `nv` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `ucos` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `salesdettbl_update` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateid` DATE NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `saleshdrtbl` (
  `arflag` VARCHAR(100) NULL,
  `arflagdate` DATETIME NULL,
  `arflaguser` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `basecodeno` VARCHAR(100) NULL,
  `bato` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `currstat` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `dmcmno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fhamt` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `grossamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `otherbadoc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `postupdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `user2` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `saleshdrtbl_update` (
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `doctype` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `fhamt` DECIMAL(18,4) NULL,
  `glstat` VARCHAR(100) NULL,
  `grossamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `otherbadoc` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `postdate` DATETIME NULL,
  `postupdate` DATETIME NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `updateid` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `serverlogintbl` (
  `pcname` VARCHAR(255) NULL,
  `sysver` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `shrinkreporttbl` (
  `amqty` DECIMAL(18,4) NULL,
  `amstock` DECIMAL(18,4) NULL,
  `availablestck` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `doqty` DECIMAL(18,4) NULL,
  `dos` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `pcnt` DECIMAL(18,4) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty2` DECIMAL(18,4) NULL,
  `qty3` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `sales` DECIMAL(18,4) NULL,
  `shrinkage` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `varqty` DECIMAL(18,4) NULL,
  `wrr` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `signtbl` (
  `frmname` VARCHAR(255) NULL,
  `fullname` VARCHAR(255) NULL,
  `plntno` VARCHAR(100) NULL,
  `signtype` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sloctbl` (
  `plntno` VARCHAR(100) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocdesc` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `smnmtbl` (
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `shrtname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `smntype` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `issby` VARCHAR(100) NULL,
  `issdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `prodreq` VARCHAR(100) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sono` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transid` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sohdrtbl` (
  `apprdate` DATE NULL,
  `apprem` DECIMAL(18,4) NULL,
  `apprvdby` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `currbal` DECIMAL(18,4) NULL,
  `custno` VARCHAR(100) NULL,
  `deldate` DATE NULL,
  `delstat` VARCHAR(100) NULL,
  `deposit` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `pc` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pdc` DECIMAL(18,4) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `soamt` DECIMAL(18,4) NULL,
  `sono` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `sysver` VARCHAR(100) NULL,
  `totar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `splpricetbl` (
  `custno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `subdoctbl` (
  `grpdoc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_forms` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `inused` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_mymenu` (
  `code` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `menudesc` VARCHAR(255) NULL,
  `menulabel` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_usergroup` (
  `ug_code` VARCHAR(100) NULL,
  `ug_name` VARCHAR(255) NULL,
  `ug_notes` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_usergrouprights` (
  `gr_deleterights` VARCHAR(100) NULL,
  `gr_editrights` VARCHAR(100) NULL,
  `gr_formcode` VARCHAR(100) NULL,
  `gr_groupcode` VARCHAR(100) NULL,
  `gr_insertrights` VARCHAR(100) NULL,
  `gr_releaserights` VARCHAR(100) NULL,
  `gr_viewrights` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sys_userrecords` (
  `empno` VARCHAR(100) NULL,
  `idstat` VARCHAR(100) NULL,
  `invchck` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `pwhint` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `useremailaddress` VARCHAR(100) NULL,
  `userfullname` VARCHAR(255) NULL,
  `usergroup` VARCHAR(100) NULL,
  `userloc` VARCHAR(100) NULL,
  `username` VARCHAR(255) NULL,
  `usernotes` TEXT NULL,
  `userpassword` VARCHAR(100) NULL,
  `usertelno` VARCHAR(100) NULL,
  `verupdate` DATE NULL,
  `wfh` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tccodestbl` (
  `document` VARCHAR(100) NULL,
  `modlongname` VARCHAR(255) NULL,
  `module` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging` (
  `custname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `dep` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invno2` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc2` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging_` (
  `areano` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `curr` VARCHAR(100) NULL,
  `custname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `datedue` DATE NULL,
  `days` DECIMAL(18,4) NULL,
  `dep` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `term` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempaging_or` (
  `curr` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `days` DECIMAL(18,4) NULL,
  `dep` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `invno2` VARCHAR(100) NULL,
  `net` DECIMAL(18,4) NULL,
  `originvamt` DECIMAL(18,4) NULL,
  `origoramt` DECIMAL(18,4) NULL,
  `pc` VARCHAR(100) NULL,
  `pdc` DECIMAL(18,4) NULL,
  `shipto` VARCHAR(255) NULL,
  `shiptoname` VARCHAR(255) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `tc2` VARCHAR(100) NULL,
  `totalar` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempasp` (
  `amt` DECIMAL(18,4) NULL,
  `asp` DECIMAL(18,4) NULL,
  `avecos` DECIMAL(18,4) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `mmgrp` VARCHAR(100) NULL,
  `mmgrpdesc` VARCHAR(255) NULL,
  `pc` VARCHAR(100) NULL,
  `pclass` VARCHAR(100) NULL,
  `qtpk` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `uccos` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `varamt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostbl` (
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostingtbl` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `cosno` VARCHAR(100) NULL,
  `dlcost` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `totohamt` DECIMAL(18,4) NULL,
  `totrmamt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcostingtbl2` (
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `ohcost` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wiptotwt` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcustbal` (
  `bussname` VARCHAR(255) NULL,
  `custno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `invbals` DECIMAL(18,4) NULL,
  `invno` VARCHAR(100) NULL,
  `payment` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcvdettbl` (
  `dramt` DECIMAL(18,4) NULL,
  `itemno` VARCHAR(100) NULL,
  `tcref` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `vpdate` DATE NULL,
  `vpno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempcwtdettbl` (
  `depapp` VARCHAR(100) NULL,
  `ewt` DECIMAL(18,4) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `orno` VARCHAR(100) NULL,
  `pc2` VARCHAR(100) NULL,
  `refno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdmcmdetwebtbl` (
  `amt` DECIMAL(18,4) NULL,
  `docdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `ewtform` VARCHAR(100) NULL,
  `invamt` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `reftc` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `stdqty` DECIMAL(18,4) NULL,
  `stdvar` DECIMAL(18,4) NULL,
  `stdwt` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet2` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodet_` (
  `codeno` VARCHAR(100) NULL,
  `dono` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdodetprt` (
  `amount` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdsreport` (
  `amqty` DECIMAL(18,4) NULL,
  `amstock` DECIMAL(18,4) NULL,
  `availablestck` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `doqty` DECIMAL(18,4) NULL,
  `dos` DECIMAL(18,4) NULL,
  `netavail_qty` DECIMAL(18,4) NULL,
  `netavail_wt` DECIMAL(18,4) NULL,
  `pcnt` DECIMAL(18,4) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty2` DECIMAL(18,4) NULL,
  `qty3` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `sales` DECIMAL(18,4) NULL,
  `salesman` VARCHAR(255) NULL,
  `shrinkage` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `varqty` DECIMAL(18,4) NULL,
  `wrr` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempdsrstck` (
  `codeno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pmstock` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qty4` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexpdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `ewtbase` DECIMAL(18,4) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `ewtrate` DECIMAL(18,4) NULL,
  `itemno` VARCHAR(100) NULL,
  `pctrno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexphdrtbl` (
  `branch` VARCHAR(100) NULL,
  `docamt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `payee` VARCHAR(255) NULL,
  `remarks` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempexpsumtbl` (
  `datechange` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `expl` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempfgcostingtbl` (
  `asp` DECIMAL(18,4) NULL,
  `avecost` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `matlcost` DECIMAL(18,4) NULL,
  `pwno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `totcost` DECIMAL(18,4) NULL,
  `uc` DECIMAL(18,4) NULL,
  `ucos` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtvar` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgledit` (
  `balamt` DECIMAL(18,4) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `docno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgljvdettbl` (
  `acctno` VARCHAR(100) NULL,
  `ccno` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgljvtbl` (
  `jvno` VARCHAR(100) NULL,
  `jvno2` VARCHAR(100) NULL,
  `jvno3` VARCHAR(100) NULL,
  `jvsource` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempglmaintbl` (
  `acctdesc` VARCHAR(255) NULL,
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `begamt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempgltranstbl` (
  `acctno` VARCHAR(100) NULL,
  `balamt` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `cramt` DECIMAL(18,4) NULL,
  `cv` VARCHAR(100) NULL,
  `dramt` DECIMAL(18,4) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `pc` VARCHAR(100) NULL,
  `pk` VARCHAR(100) NULL,
  `prioryradjt` VARCHAR(100) NULL,
  `subacct` VARCHAR(100) NULL,
  `transyear` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvbals` (
  `codeno` VARCHAR(100) NULL,
  `etadate` DATE NULL,
  `expdate` DATE NULL,
  `issqty` DECIMAL(18,4) NULL,
  `isswt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `recqty` DECIMAL(18,4) NULL,
  `recwt` DECIMAL(18,4) NULL,
  `rivno` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wrrwt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvbalsnew_` (
  `codeno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qtybalbeg` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wtbalbeg` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `expdate` DATE NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmrrno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `venno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvtbl` (
  `codeno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `qty_bal` DECIMAL(18,4) NULL,
  `qty_in` VARCHAR(100) NULL,
  `qty_out` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt_bal` DECIMAL(18,4) NULL,
  `wt_in` VARCHAR(100) NULL,
  `wt_out` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempinvtbl2` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `costamt` DECIMAL(18,4) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty_bal` DECIMAL(18,4) NULL,
  `qty_in` VARCHAR(100) NULL,
  `qty_out` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `uc` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt_bal` DECIMAL(18,4) NULL,
  `wt_in` VARCHAR(100) NULL,
  `wt_out` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempissdettbl` (
  `adddesc` VARCHAR(255) NULL,
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `dono` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `slocto` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempisshdrtbl` (
  `dono` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `pono` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `shipto` VARCHAR(255) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `templotnotbl` (
  `codeno` VARCHAR(100) NULL,
  `docno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `note` TEXT NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempmodstattbl` (
  `audit1` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `jvno` VARCHAR(100) NULL,
  `modname` VARCHAR(255) NULL,
  `refno` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayadjt` (
  `adjtamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `mainidno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaycommtbl` (
  `autoamt` DECIMAL(18,4) NULL,
  `commadjt` DECIMAL(18,4) NULL,
  `empname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `smnno` VARCHAR(100) NULL,
  `totcomm` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaydeno` (
  `b100` DECIMAL(18,4) NULL,
  `b1000` DECIMAL(18,4) NULL,
  `b1000amt` DECIMAL(18,4) NULL,
  `b1000excess` DECIMAL(18,4) NULL,
  `b100amt` DECIMAL(18,4) NULL,
  `b100excess` DECIMAL(18,4) NULL,
  `b20` DECIMAL(18,4) NULL,
  `b200` DECIMAL(18,4) NULL,
  `b200amt` DECIMAL(18,4) NULL,
  `b200excess` DECIMAL(18,4) NULL,
  `b20amt` DECIMAL(18,4) NULL,
  `b20excess` DECIMAL(18,4) NULL,
  `b50` DECIMAL(18,4) NULL,
  `b500` DECIMAL(18,4) NULL,
  `b500amt` DECIMAL(18,4) NULL,
  `b500excess` DECIMAL(18,4) NULL,
  `b50amt` DECIMAL(18,4) NULL,
  `b50excess` DECIMAL(18,4) NULL,
  `c1` DECIMAL(18,4) NULL,
  `c10` DECIMAL(18,4) NULL,
  `c10amt` DECIMAL(18,4) NULL,
  `c10excess` DECIMAL(18,4) NULL,
  `c1amt` DECIMAL(18,4) NULL,
  `c1excess` DECIMAL(18,4) NULL,
  `c5` DECIMAL(18,4) NULL,
  `c5amt` DECIMAL(18,4) NULL,
  `c5excess` DECIMAL(18,4) NULL,
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `netpay` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayearntbl` (
  `absent_hrs` DECIMAL(18,4) NULL,
  `elhrs` DECIMAL(18,4) NULL,
  `empfullname` VARCHAR(255) NULL,
  `empno` VARCHAR(100) NULL,
  `extratime_dhrs` DATETIME NULL,
  `holidayhrs` DECIMAL(18,4) NULL,
  `late_dhrs` DECIMAL(18,4) NULL,
  `nightdiffhrs` DECIMAL(18,4) NULL,
  `othrleavehrs` DECIMAL(18,4) NULL,
  `otime_dhrs` DATETIME NULL,
  `payidno` VARCHAR(100) NULL,
  `regtime_dhrs` DATETIME NULL,
  `sl_dhrs` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `vl_dhrs` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayloansalltbl` (
  `bank11` VARCHAR(100) NULL,
  `bank12` VARCHAR(100) NULL,
  `ca1` VARCHAR(100) NULL,
  `ca2` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hdmfhse1` VARCHAR(100) NULL,
  `hdmfhse2` VARCHAR(100) NULL,
  `hdmfsal1` VARCHAR(100) NULL,
  `hdmfsal2` VARCHAR(100) NULL,
  `othr3` VARCHAR(100) NULL,
  `ssscal1` VARCHAR(100) NULL,
  `ssscal2` VARCHAR(100) NULL,
  `ssssal1` VARCHAR(100) NULL,
  `ssssal2` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayndifftbl` (
  `ccno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `ndcode` VARCHAR(100) NULL,
  `ndhrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayotd` (
  `adjtamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `fullname` VARCHAR(255) NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `loanrefno` VARCHAR(100) NULL,
  `mainidno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `payidno` VARCHAR(100) NULL,
  `taxopt` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayotearntbl` (
  `ccno` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `empno` VARCHAR(100) NULL,
  `hrs` DECIMAL(18,4) NULL,
  `payidno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayothrloantbl` (
  `deductamt` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `loanamt` DECIMAL(18,4) NULL,
  `loanbalamt` DECIMAL(18,4) NULL,
  `loanrefno` VARCHAR(100) NULL,
  `paycodeno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaypcgrptbl` (
  `empno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppaytaxannual` (
  `basictax` VARCHAR(100) NULL,
  `basictaxamt` DECIMAL(18,4) NULL,
  `earngross` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `excesstaxamt` DECIMAL(18,4) NULL,
  `hdmfprem` DECIMAL(18,4) NULL,
  `nettaxableinc` DECIMAL(18,4) NULL,
  `nettaxdue` DECIMAL(18,4) NULL,
  `otataxable` VARCHAR(100) NULL,
  `otdtaxable` VARCHAR(100) NULL,
  `phprem` DECIMAL(18,4) NULL,
  `sssprem` DECIMAL(18,4) NULL,
  `taxableamtytd` DECIMAL(18,4) NULL,
  `taxdue` DECIMAL(18,4) NULL,
  `taxrate` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temppayvlsltbl` (
  `begel` DECIMAL(18,4) NULL,
  `begsl` DECIMAL(18,4) NULL,
  `begvl` DECIMAL(18,4) NULL,
  `elbals` DECIMAL(18,4) NULL,
  `empno` VARCHAR(100) NULL,
  `slbals` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `vlbals` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempplnttbl` (
  `plntno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `temprivdettbl` (
  `amt` DECIMAL(18,4) NULL,
  `codeno` VARCHAR(100) NULL,
  `currinv` DECIMAL(18,4) NULL,
  `dsrno` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `mmdesc` VARCHAR(255) NULL,
  `pono` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `qtybal` DECIMAL(18,4) NULL,
  `refno` VARCHAR(100) NULL,
  `rivno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `uc` DECIMAL(18,4) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsalesdettbl` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detamt` DECIMAL(18,4) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `invno` VARCHAR(100) NULL,
  `invstat` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsalesdettbl2` (
  `billref` VARCHAR(100) NULL,
  `codeno` VARCHAR(100) NULL,
  `detdiscamt` DECIMAL(18,4) NULL,
  `detgrossamt` DECIMAL(18,4) NULL,
  `detvat` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `itemno` VARCHAR(100) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `nv` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sp` DECIMAL(18,4) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tempsodettbl` (
  `codeno` VARCHAR(100) NULL,
  `discamt` DECIMAL(18,4) NULL,
  `itmamt` DECIMAL(18,4) NULL,
  `itmno` VARCHAR(100) NULL,
  `netamt` DECIMAL(18,4) NULL,
  `qtbal` DECIMAL(18,4) NULL,
  `qty` DECIMAL(18,4) NULL,
  `sloc` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL,
  `wtbal` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `translog` (
  `datetimelog` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `form` VARCHAR(100) NULL,
  `pcipadd` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `trans` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `updatetbl` (
  `dateupdate` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `origname` VARCHAR(255) NULL,
  `refdoc` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `tc` VARCHAR(100) NULL,
  `update_dateonly` DATE NULL,
  `user` VARCHAR(100) NULL,
  `web` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `userplnttbl` (
  `plntno` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `userid` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `venmasttbl` (
  `address` TEXT NULL,
  `address2` TEXT NULL,
  `branch` VARCHAR(100) NULL,
  `cgtype` VARCHAR(100) NULL,
  `chname` VARCHAR(255) NULL,
  `conper` VARCHAR(100) NULL,
  `cotype` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `custven` VARCHAR(100) NULL,
  `datechange` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `emailadd` VARCHAR(100) NULL,
  `ewtcode` VARCHAR(100) NULL,
  `headcash` DECIMAL(18,4) NULL,
  `mmrrreq` VARCHAR(100) NULL,
  `pcfcust` VARCHAR(100) NULL,
  `poreq` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `telno` VARCHAR(100) NULL,
  `terms` VARCHAR(100) NULL,
  `tin` VARCHAR(100) NULL,
  `tin2` VARCHAR(100) NULL,
  `tin3` VARCHAR(100) NULL,
  `tin4` VARCHAR(100) NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vat` VARCHAR(100) NULL,
  `venname` VARCHAR(255) NULL,
  `venno` VARCHAR(100) NULL,
  `ventype` VARCHAR(100) NULL,
  `ventype2` VARCHAR(100) NULL,
  `whtax` VARCHAR(100) NULL,
  `zip1` VARCHAR(100) NULL,
  `zip2` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `voidreqtbl` (
  `appby` VARCHAR(100) NULL,
  `appdate` DATE NULL,
  `docno` VARCHAR(100) NULL,
  `pdate` DATE NULL,
  `remarks` TEXT NULL,
  `reqstat` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `user` VARCHAR(100) NULL,
  `vdocno` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wipdettbl` (
  `codeno` VARCHAR(100) NULL,
  `datepost` DATETIME NULL,
  `dono` VARCHAR(100) NULL,
  `dprno` VARCHAR(100) NULL,
  `fgtype` VARCHAR(100) NULL,
  `itmno` VARCHAR(100) NULL,
  `liqrepno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `remarks` TEXT NULL,
  `source` VARCHAR(100) NULL,
  `sp` DECIMAL(18,4) NULL,
  `status` VARCHAR(100) NULL,
  `stdcosamt` DECIMAL(18,4) NULL,
  `stduc` DECIMAL(18,4) NULL,
  `tc` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `ucstat` VARCHAR(100) NULL,
  `um` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wipno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wrrdettbl` (
  `codeno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `transid` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL,
  `wrrno` VARCHAR(100) NULL,
  `wrrqtybeg` VARCHAR(100) NULL,
  `wrrwtbeg` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wrrhdrtbl` (
  `codeno` VARCHAR(100) NULL,
  `custno` VARCHAR(100) NULL,
  `dsrno` VARCHAR(100) NULL,
  `dsrstat` VARCHAR(100) NULL,
  `lotno` VARCHAR(100) NULL,
  `mov` VARCHAR(100) NULL,
  `plntno` VARCHAR(100) NULL,
  `qty` DECIMAL(18,4) NULL,
  `smnno` VARCHAR(100) NULL,
  `status` VARCHAR(100) NULL,
  `tc` VARCHAR(100) NULL,
  `totqty` DECIMAL(18,4) NULL,
  `totwt` DECIMAL(18,4) NULL,
  `transdate` DATE NULL,
  `wrrno` VARCHAR(100) NULL,
  `wt` DECIMAL(18,4) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `batbl` (`ba`, `bussname`) SELECT * FROM (SELECT '8100' a, 'JCS Chemical Industries, Inc.' b UNION ALL SELECT '8200', 'APF Corporation' UNION ALL SELECT '8300', 'Chemag Trading Corporation') x WHERE NOT EXISTS (SELECT 1 FROM `batbl`);

CREATE DATABASE IF NOT EXISTS `bfi` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `bfi`;

CREATE TABLE IF NOT EXISTS `admtbl` (
  `branch` VARCHAR(100) NULL,
  `dateupdate` DATETIME NULL,
  `description` TEXT NULL,
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `mainmod` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `reqtype` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `updateby` DATE NULL,
  `user` VARCHAR(100) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `qryreqttbl` (
  `branch` VARCHAR(100) NULL,
  `createdby` VARCHAR(100) NULL,
  `datecreated` DATETIME NULL,
  `docno` VARCHAR(100) NULL,
  `remarks` TEXT NULL,
  `reqname` VARCHAR(255) NULL,
  `reqtype` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `transdate` DATE NULL,
  `type1` VARCHAR(100) NULL,
  `type2` VARCHAR(100) NULL,
  `user` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE DATABASE IF NOT EXISTS `bfi_admin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `bfi_admin`;

CREATE TABLE IF NOT EXISTS `batbl` (
  `add_birform` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `apprvdby` VARCHAR(100) NULL,
  `ba` VARCHAR(100) NULL,
  `bir_sign` VARCHAR(100) NULL,
  `bir_sign_poss` VARCHAR(100) NULL,
  `bir_sign_tin` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `bussname` VARCHAR(255) NULL,
  `ccadmin` VARCHAR(100) NULL,
  `cclogis` VARCHAR(100) NULL,
  `ccprod` VARCHAR(100) NULL,
  `ccsales` VARCHAR(100) NULL,
  `cctech` VARCHAR(100) NULL,
  `cdcrproc` VARCHAR(100) NULL,
  `cotin1` VARCHAR(100) NULL,
  `cotin2` VARCHAR(100) NULL,
  `cotin3` VARCHAR(100) NULL,
  `cotin4` VARCHAR(100) NULL,
  `dloadstat` VARCHAR(100) NULL,
  `hmdfcon15` VARCHAR(100) NULL,
  `hmdfcon30` VARCHAR(100) NULL,
  `hmdfconw1` VARCHAR(100) NULL,
  `hmdfconw2` VARCHAR(100) NULL,
  `hmdfconw3` VARCHAR(100) NULL,
  `hmdfconw4` VARCHAR(100) NULL,
  `nonexps` VARCHAR(100) NULL,
  `notedby` VARCHAR(100) NULL,
  `ph_max` VARCHAR(100) NULL,
  `ph_mid` VARCHAR(100) NULL,
  `ph_min` VARCHAR(100) NULL,
  `ph_rate` DECIMAL(18,4) NULL,
  `phcon15` VARCHAR(100) NULL,
  `phcon30` VARCHAR(100) NULL,
  `phconw1` VARCHAR(100) NULL,
  `phconw2` VARCHAR(100) NULL,
  `phconw3` VARCHAR(100) NULL,
  `phconw4` VARCHAR(100) NULL,
  `poapprby` VARCHAR(100) NULL,
  `server_note` TEXT NULL,
  `shrtname` VARCHAR(255) NULL,
  `ssscon15` VARCHAR(100) NULL,
  `ssscon30` VARCHAR(100) NULL,
  `sssconw1` VARCHAR(100) NULL,
  `sssconw2` VARCHAR(100) NULL,
  `sssconw3` VARCHAR(100) NULL,
  `sssconw4` VARCHAR(100) NULL,
  `ssstable` VARCHAR(100) NULL,
  `stat` VARCHAR(100) NULL,
  `taxextra` VARCHAR(100) NULL,
  `zip` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `batbl` (`ba`, `bussname`) SELECT * FROM (SELECT '8100' a, 'JCS Chemical Industries, Inc.' b UNION ALL SELECT '8200', 'APF Corporation' UNION ALL SELECT '8300', 'Chemag Trading Corporation') x WHERE NOT EXISTS (SELECT 1 FROM `batbl`);
