#!/bin/sh
here="`pwd`"
# default is to *not* git add to target
if [ -z "$gitmod" ] ; then
	gitmod=0
fi

dir="$(dirname $0)"
cd "$dir"
scriptloc="$(pwd)"
echo $scriptloc

cd ../../../../sdk-examples || exit  # only 3 ../ if using submodule
target="$(pwd)"

cd $scriptloc
# exclude non-sample code files like nodejs/node_modules
find * |\
egrep -v '^striptags|^nodejs/node_modules|^nodejs/package-lock.json' |\
 while read f ; do
  if [ -d $f ] ; then
    if [ ! -d $target/$f ] ; then
        echo Creating directory $target/$f
	mkdir $target/$f || exit
	if [ $gitmod -eq 1 ] ; then 
		echo git add $target/$f
		( cd $target ; git add $f )
	fi
    fi
  else
	egrep -v '#tag|#end' $f > /tmp/stripped.$$
        test  $? -gt 1 && exit
	diff -q /tmp/stripped.$$ $target/$f  > /dev/null
        if [ $? -ne 0 ] ; then 
		echo copied stripped version of $f to $target/$f 
		mv /tmp/stripped.$$ $target/$f || exit
		if [ $gitmod -eq 1 ] ; then 
			echo git add $target/$f
			( cd $target ; git add $f )
		fi
	fi
  fi
done
rm -f /tmp/stripped.$$
cd "$here"
