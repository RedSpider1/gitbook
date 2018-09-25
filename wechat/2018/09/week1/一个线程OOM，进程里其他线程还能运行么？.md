# 引言
偶然的情况，看到了一个大厂面试题：
>一个进程有3个线程，如果一个线程抛出oom，其他两个线程还能运行么?

很有意思的一道题，首先想到的切入点是内存模型。大家都知道，堆是共享的，栈是线程私有的。所以我们可以猜测：

1. 如果是栈发生了OOM，那么不会影响其他的线程。
2. 如果是堆发生了OOM，由于堆共享，那么其他的线程讲道理的话也会发生OOM，但是不知道JVM是否做了优化。

上述结论仅仅是猜测，我们需要做实验去验证猜测是否正确。文章尾部有结论，心急的同学可以跳过实验部分。

# 实验
### 实验环境
* jdk1.8
* jvm参数配置

```java
-Xms20m
-Xmx20m
-XX:+HeapDumpOnOutOfMemoryError
-ea
```
### 实验1
目的：单个线程的可用内存空间是多大。

方式：以1M为单位循环分配。
```java
public static void main(String[] arg0){
    List<byte[]> myList=new ArrayList<>();
    int i=1;
    while(true){
        System.out.println("正在进行第"+i+"次分配");
        byte[] arrayByte=new byte[1024*1024*1];//申请1M的空间
        myList.add(arrayByte);//强引用，不会被JVM回收
        System.out.println("第"+i+"次分配完成");
        i++;
    }
}
```
部分的输出结果：
```java
正在进行第17次分配
第17次分配完成
正在进行第18次分配
java.lang.OutOfMemoryError: Java heap space
Dumping heap to java_pid14996.hprof ...
Heap dump file created [19271156 bytes in 0.018 secs]
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
	at MyClass.main(MyClass.java:11)
```
结论：在我们的环境下，只支持分配17次1M的空间，申请第18次分配会失败。

### 实验2
目的：一个线程在栈内存发生OOM，进程里其他线程还能运行吗？

方式：线程1调用没有出口的递归函数，线程2无限打印。
```java
public class Test {
    private int count=0;
    public void recursion(){
        count++;
        System.out.println("第"+count+"次执行recursion");
        recursion();
    }
    public static void main(String[] arg0){
        new Thread( () -> {
            Test t =new Test();
            t.recursion();
        },"thread1").start();
        new Thread( () -> {
            while(true){
                try {
                    Thread.sleep(5);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(new Date().toString()+Thread.currentThread()+"==");
            }
        },"thread2").start();
    }
}
```
输出结果（截取）：
```java
第6547次执行recursion
第6548次执行recursion
第6549次执行recursion
第6550次执行recursion
Tue Sep 25 15:54:55 CST 2018Thread[thread2,5,main]==
第6551次执行recursion
第6552次执行recursion
第6553次执行recursion
第6554次执行recursion
第6555次执行recursion
```
这个输出是前半截输出，两个线程交替执行。
```
第6943次执行recursion
第6944次执行recursion
第6945次执行recursionException in thread "thread1" java.lang.StackOverflowError
	at sun.nio.cs.UTF_8$Encoder.encodeLoop(UTF_8.java:691)
	at java.nio.charset.CharsetEncoder.encode(CharsetEncoder.java:579)
	at sun.nio.cs.StreamEncoder.implWrite(StreamEncoder.java:271)
	at sun.nio.cs.StreamEncoder.write(StreamEncoder.java:125)
	at java.io.OutputStreamWriter.write(OutputStreamWriter.java:207)
	at java.io.BufferedWriter.flushBuffer(BufferedWriter.java:129)
	at java.io.PrintStream.newLine(PrintStream.java:545)
	at java.io.PrintStream.println(PrintStream.java:807)
	at Test.recursion(Test.java:9)
	at Test.recursion(Test.java:10)

	at Test.recursion(Test.java:10)
	at Test.recursion(Test.java:10)
	at Test.recursion(Test.java:10)
Tue Sep 25 15:54:55 CST 2018Thread[thread2,5,main]==
Tue Sep 25 15:54:55 CST 2018Thread[thread2,5,main]==
Tue Sep 25 15:54:55 CST 2018Thread[thread2,5,main]==
Tue Sep 25 15:54:55 CST 2018Thread[thread2,5,main]==
Tue Sep 25 15:54:55 CST 2018Thread[thread2,5,main]==
Tue Sep 25 15:54:55 CST 2018Thread[thread2,5,main]==
```
这个输出是线程1发生了栈的OOM，但是线程2依旧在执行。所以，验证了我们的猜测1是正确的。
### 实验3-1
目的：一个线程在堆内存发生OOM，进程里其他线程还能运行吗？

方式：开启多线程，让其中一个线程每隔1s申请1M空间，另外一个线程每隔1s打印。

```java
public static void main(String[] arg0){
    new Thread( () -> {
        List<byte[]> myList=new ArrayList<>();
        int i=1;
        while(true){
            System.out.println(new Date().toString()+Thread.currentThread()+"==第"+i+"次分配");
            byte[] bytes = new  byte[1024 * 1024 *1];
            i++;
            myList.add(bytes);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    },"thread1").start();

    new Thread( () -> {
        while(true){
        System.out.println(new Date().toString() + Thread.currentThread() + "==");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    },"thread2").start();
}
```
部分的输出结果：
```java
Tue Sep 25 14:30:11 CST 2018Thread[thread1,5,main]==第15次分配
Tue Sep 25 14:30:12 CST 2018Thread[thread2,5,main]==
Tue Sep 25 14:30:12 CST 2018Thread[thread1,5,main]==第16次分配
Tue Sep 25 14:30:13 CST 2018Thread[thread2,5,main]==
Tue Sep 25 14:30:14 CST 2018Thread[thread1,5,main]==第17次分配
Tue Sep 25 14:30:14 CST 2018Thread[thread2,5,main]==
Tue Sep 25 14:30:15 CST 2018Thread[thread1,5,main]==第18次分配
java.lang.OutOfMemoryError: Java heap space
Dumping heap to java_pid14928.hprof ...
Heap dump file created [19771857 bytes in 0.016 secs]
Exception in thread "thread1" java.lang.OutOfMemoryError: Java heap space
	at MyClass$1.run(MyClass.java:15)
	at java.lang.Thread.run(Thread.java:745)
Tue Sep 25 14:30:15 CST 2018Thread[thread2,5,main]==
Tue Sep 25 14:30:16 CST 2018Thread[thread2,5,main]==
Tue Sep 25 14:30:17 CST 2018Thread[thread2,5,main]==
Tue Sep 25 14:30:18 CST 2018Thread[thread2,5,main]==
```
在第18次申请空间的时候，发生了OOM，但是线程2依然在执行。
### 实验3-2
有人说，在实验3-1中，线程2只有打印，没有申请空间。那么假如在线程1发生OOM的时候，线程2申请空间的话，线程2还会继续运行吗？

这个简单，让线程1和线程2执行相同的线程任务，都每个1s申请一次1M的空间。
```java
class MyRunable implements Runnable{
    @Override
    public void run() {
        List<byte[]> myList2=new ArrayList<>();
        int i=1;
        while(true){
            System.out.println(new Date().toString() + Thread.currentThread() + "==第"+i+"次分配");
            byte[] bytes2 = new  byte[1024 * 1024 *1];
            i++;
            myList2.add(bytes2);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
public class MyClass {
    public static void main(String[] arg0){
        MyRunable myRunable=new MyRunable();
        Thread t1=new Thread(myRunable,"thread1");
        Thread t2=new Thread(myRunable,"thread2");
        t1.start();
        t2.start();
        
    }
}
```
部分输出结果：
```java

Tue Sep 25 15:38:39 CST 2018Thread[thread1,5,main]==正在第8次分配
Tue Sep 25 15:38:39 CST 2018Thread[thread1,5,main]==第8次分配完成
Tue Sep 25 15:38:39 CST 2018Thread[thread2,5,main]==正在第8次分配
Tue Sep 25 15:38:39 CST 2018Thread[thread2,5,main]==第8次分配完成
Tue Sep 25 15:38:40 CST 2018Thread[thread1,5,main]==正在第9次分配
Tue Sep 25 15:38:40 CST 2018Thread[thread1,5,main]==第9次分配完成
Tue Sep 25 15:38:40 CST 2018Thread[thread2,5,main]==正在第9次分配
java.lang.OutOfMemoryError: Java heap space
Dumping heap to java_pid3424.hprof ...
Heap dump file created [19713829 bytes in 0.017 secs]
Exception in thread "thread2" java.lang.OutOfMemoryError: Java heap space
	at MyRunable.run(MyClass.java:60)
	at java.lang.Thread.run(Thread.java:745)
Tue Sep 25 15:38:41 CST 2018Thread[thread1,5,main]==正在第10次分配
Tue Sep 25 15:38:41 CST 2018Thread[thread1,5,main]==第10次分配完成
Tue Sep 25 15:38:42 CST 2018Thread[thread1,5,main]==正在第11次分配
Tue Sep 25 15:38:42 CST 2018Thread[thread1,5,main]==第11次分配完成
Tue Sep 25 15:38:43 CST 2018Thread[thread1,5,main]==正在第12次分配
Tue Sep 25 15:38:43 CST 2018Thread[thread1,5,main]==第12次分配完成
Tue Sep 25 15:38:44 CST 2018Thread[thread1,5,main]==正在第13次分配
Tue Sep 25 15:38:44 CST 2018Thread[thread1,5,main]==第13次分配完成
Tue Sep 25 15:38:45 CST 2018Thread[thread1,5,main]==正在第14次分配
Tue Sep 25 15:38:45 CST 2018Thread[thread1,5,main]==第14次分配完成
Tue Sep 25 15:38:46 CST 2018Thread[thread1,5,main]==正在第15次分配
Tue Sep 25 15:38:46 CST 2018Thread[thread1,5,main]==第15次分配完成
Tue Sep 25 15:38:47 CST 2018Thread[thread1,5,main]==正在第16次分配
Tue Sep 25 15:38:47 CST 2018Thread[thread1,5,main]==第16次分配完成
Tue Sep 25 15:38:48 CST 2018Thread[thread1,5,main]==正在第17次分配
Tue Sep 25 15:38:48 CST 2018Thread[thread1,5,main]==第17次分配完成
Tue Sep 25 15:38:49 CST 2018Thread[thread1,5,main]==正在第18次分配
Exception in thread "thread1" java.lang.OutOfMemoryError: Java heap space
	at MyRunable.run(MyClass.java:60)
	at java.lang.Thread.run(Thread.java:745)
```
结果出现了两次OOM，第一次OOM是线程1的第九次分配完成，而线程2正在第九次分配的时候，线程2出现了OOM,紧接着，线程1继续执行。

大家可以注意一下次数，不难发现：
1. 第一次OOM，成功分配的次数是17次（线程1成功了9次+线程2成功了8次），第18次分配失败，这和实验1的结果一样的，证明线程1和线程2共享堆内存。
2. 第一次OOM之后，线程2不再执行，而线程1继续执行，执行到第18次分配时，发生了OOM，这个数字也刚好对应实验1。

# 结论
一个线程OOM，会马上进行一次GC，然后把发生OOM的线程占用的空间清除，**进程里其他线程还能运行**。
# 说明
有的粉丝认为，`Error`是指的是严重的错误，一旦发生了Error,那么JVM将会立即停止运行的程序。在这篇文章的demo中可以看到，并不是所有的Error都会导致JVM崩溃，相反，现代JVM还能够很好地优化一些Error。
# 参考文献
https://www.jianshu.com/p/e26ef4429612

