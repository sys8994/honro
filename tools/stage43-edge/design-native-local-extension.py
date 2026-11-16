from pathlib import Path
from lxml import etree as E
import copy,os,subprocess,json,hashlib
import sys
ROOT=Path(__file__).resolve().parents[2]
out=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT.parent/'stage43-native-designed-extension-reproduce'
out.mkdir(parents=True,exist_ok=True)
ns='{http://www.w3.org/2000/svg}';src=ROOT/'art/stage43-edge/source.svg'
r=E.parse(str(src)).getroot();r.set('viewBox','0 0 2172 1080');r.set('height','1080')
# Original is intact. Draw only the terminal nonwalking strip and new exterior.
# Top anchors correspond to original native palette boundaries at y700.
g=E.SubElement(r,ns+'g',id='east-nonwalking-native-extension')
faces=[
('#25364a','M1925 700H2160L2172 738V1080H1925Z'),
('#37475c','M1925 700H1940L1917 741L1904 775L1925 789L1954 758L1964 731Z'),
('#162332','M1986 700H1999L1981 741L1962 778L1958 799L1937 832L1925 840V824L1946 786L1948 769Z'),
('#37475c','M2000 700H2029L2017 735L1986 775L1976 783L1985 752Z'),
('#37475c','M2054 700H2068L2042 756L2025 801L2018 817L2013 804L2021 766Z'),
('#162332','M2160 700L2172 738V1080H2153L2162 1006L2145 947L2152 892L2135 852L2157 811L2154 759Z'),
('#37475c','M1925 856L1950 834L1990 803L2018 817L1992 860L1956 902L1925 925Z'),
('#4f5d71','M1950 834L1984 807Q1990 803 1995 806L2014 815L2018 817L1997 828L1960 859L1942 865Z'),
('#25364a','M2018 817L2051 837L2030 888L1993 942L1956 956L1956 902L1992 860Z'),
('#162332','M1990 803L2004 782L2014 765L2009 804L2018 817L1997 828Z'),
('#162332','M1925 925L1956 902L1956 956L1932 978L1925 995Z'),
('#37475c','M2077 776L2115 748Q2122 744 2128 747L2147 755Q2154 759 2150 765L2132 796L2102 844L2070 881L2051 869L2064 820Z'),
('#4f5d71','M2077 776L2115 748Q2122 744 2128 747L2147 755Q2154 759 2150 761L2137 766L2105 790L2070 820Z'),
('#25364a','M2154 759L2157 811L2135 852L2152 892L2115 924L2070 951L2070 881L2102 844L2132 796Z'),
('#162332','M2051 837L2051 869L2070 881L2070 951L2053 972L2047 917L2030 888Z'),
('#37475c','M1956 956L1993 942L2023 903L2047 917L2053 972L2013 1016L1974 1040L1940 1052L1932 978Z'),
('#4f5d71','M1993 942L2023 903L2047 917L2029 936L1998 975L1979 981Z'),
('#25364a','M2047 917L2053 972L2034 1003L2047 1043L2031 1080H1974V1040L2013 1016Z'),
('#37475c','M2115 924L2152 892L2145 947L2162 1006L2130 1043L2084 1080H2031L2047 1043L2087 988Z'),
('#4f5d71','M2115 924L2152 892L2139 932L2112 966L2087 988L2096 954Z'),
('#162332','M1956 902L1984 874L1973 902L1964 912L1961 936Z'),
('#162332','M2106 795L2099 822L2080 846L2088 820Z'),
('#162332','M2010 965L2002 994L1989 1004L1995 984Z'),
('#162332','M2128 991L2124 1014L2105 1031L2115 1011Z'),
]
# Secondary irregular chips and shadow cuts, individually drawn, not repeated stamps.
faces += [
('#25364a','M2001 720C2003 723 1999 729 1995 734L1991 738L1994 729Z'),
('#25364a','M2041 754L2032 770L2030 786C2033 782 2036 777 2036 772Z'),
('#25364a','M2108 782C2113 779 2117 781 2114 785L2105 793L2099 795Z'),
('#657184','M2122 752L2132 751L2128 755L2115 763L2113 761Z'),
('#25364a','M1958 848L1970 838L1977 837L1973 844L1965 848L1959 855Z'),
('#657184','M1988 815L1996 814L1992 818L1981 823Z'),
('#25364a','M1963 872L1955 884L1951 892L1957 889L1969 875Z'),
('#162332','M2138 823C2141 821 2144 822 2141 825L2130 835L2132 830Z'),
('#25364a','M2112 861L2111 872L2104 886L2108 881L2115 866Z'),
('#25364a','M2012 929L2020 922L2025 923L2022 931L2016 935L2008 947L2007 941Z'),
('#657184','M2018 916L2024 912L2030 915L2028 918L2022 917Z'),
('#25364a','M1984 988L1977 1001L1973 1016L1978 1011L1989 993Z'),
('#25364a','M2117 942L2125 930L2133 926L2129 936L2120 944L2116 951Z'),
('#25364a','M2077 1039L2085 1027L2090 1023L2089 1031L2076 1048Z'),
('#162332','M2066 1016L2066 1028L2061 1041L2064 1034L2070 1022Z'),
]
for i,(fill,d) in enumerate(faces):E.SubElement(g,ns+'path',id=f'linked-rock-face-{i}',fill=fill,d=d)
E.ElementTree(r).write(str(out/'edited-source.svg'))
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')}
for name,tree in [('before',E.parse(str(src)).getroot()),('after',r)]:
 for region,vb,w in [('detail','1925 610 235 450',705),('context','1750 430 422 650',844)]:
  v=copy.deepcopy(tree);v.set('viewBox',vb);v.set('width',vb.split()[2]);v.set('height',vb.split()[3]);f=out/f'{name}-{region}.svg';E.ElementTree(v).write(str(f));subprocess.run(['inkscape',str(f),'--export-type=png',f'--export-width={w}',f'--export-filename={out}/{name}-{region}.png'],env=env,check=True,capture_output=True)
(out/'report.json').write_text(json.dumps({'sourceSHA':hashlib.sha256(src.read_bytes()).hexdigest(),'scope':'small east lower exterior native designed patch only; outer patch boundary not full-stage solution','newPaths':len(faces),'protectedAboveSourceY':700,'method':'original full source retained, terminal rock palette boundaries used as upper anchors, new irregular linked planes and fractures authored as native SVG paths and rendered by Inkscape','notDeployed':True},indent=2))
