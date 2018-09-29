2018年9月25日，Oracle正式发布了Java 11。不同于Java 9与Java 10的是，Java 11是一个LTS(长期支持)的版本，Oracle表示会对Java 11提供大力支持，将会持续至2026年9月。

上一个LTS的版本是Java 8，Java 8将会支持到2025年。而且Java 8是一个改动较大的版本，相比于Java 7增加了很多新特性。所以很多企业目前使用的Java版本都是Java 8。

而Java 11作为下一个LTS版本，是绝对值得学习和尝试使用的。那Java 11相对与Java8有哪些主要的改动呢？

# 本地变量推断
使用`var`关键字来声明变量，编译器会自动推断类型。这是Java 10带来的特性比如：

```java
// 使用String声明
String redSpider = "RedSpider";

// 使用var声明
var redSpider = "RedSpider"；
```

`var`只是一个语法糖，如果你查看上述代码编译而成的字节码，会发现它们是一模一样的。`var`关键字会被Java编译器编译为String。

而Java 11对`var`进行了增强，使它能够用在lambda表达式的局部变量声明中。
```java
list.stream()
    .map((var s) -> s.toLowerCase())
    .collect(Collectors.toList());
```

当然，上述代码其实是可以简写成下面这种形式的：
```java
list.stream()
     .map(s -> s.toLowerCase())
     .collect(Collectors.toList());
```
那`var`在lambda里有什么用？有一种情况是你需要在lambda里变量声明的时候使用注解的时候，这个时候就可以使用`var`了。比如：
```java
list.stream()
      .map((@Notnull var s) -> s.toLowerCase())
      .collect(Collectors.toList());
```

# 一个命令运行程序
在以前，我们运行一个Java程序，需要先用**javac**编译成class文件，然后使用**java**命令去运行。而在Java 11中，我们只需要一行**java**命令就可以搞定：
```bash
java -classpath /home/foo/java Hello.java RedSpider

# 等价于以前的
javac -classpath /home/foo/java Hello.java
java -classpath /home/foo/java Hello RedSpider
```
# 正式加入HTTP客户端
在JDK 9的时候，就提供了一些API用于HTTP客户端支持HTTP 2[JEP 110](http://openjdk.java.net/jeps/110)。但这些API是放在**incubator module**里面的，开发者可以试用这些API并提出改进意见（这些API在JDK 10中有所更新）。而在JDK 11中，它们被加入到了Java SE 11标准库中。

它们在`java.net.http`包中，主要有以下类：
- HttpClient
- HttpRequest
- HttpResponse
- WebSocket

它们提供了一些支持**同步**和**异步**的方法。

# 移除Java EE和CORBA模块
从Java 9开始，就提议要把rt.jar分成不同的模块。在Java SE 11标准库中，移除了`java.se.ee`下面的6个模块。它们分别是：
- corba
- transaction
- activation
- xml.bind
- xml.ws
- xml.ws.annotation

# 新的API
有许多的API更新。这里挑几个大家可能常用的。
## 字符串
#### java.lang.String
String添加了几个常用的用于处理字符串的API
- boolean isBlank(): 如果字符串是null或者是""，返回true，否则返回false
- Stream lines()：返回这个字符串的函数。分隔符默认为"\"
- String repeat(int)：返回原字符串重复几次的新字符串。比如"ab".repeat(3)，返回"ababab"。
- String strip(): 去掉头尾的空白符，返回一个新的字符串
- String stripLeading(): 去掉头部的空白符
- String stripTrainling(): 去掉尾部的空白符

你可能会问，`strip()`和`trim()`用什么区别？一句话，`strip()`是`trim()`用于支持Unicode的进化版。详情查看：[Difference between String trim() and strip() methods in Java 11](https://stackoverflow.com/questions/51266582/difference-between-string-trim-and-strip-methods-in-java-11)。

#### StringBuilder和StringBuffer
这两个类都新加了一个`compareTo()`方法，这个方法和**CharSequence**类新增的**int compare(CharSequence, CharSequence)**方法类似。两个CharSequence从第一个字符开始比较每个字符，然后返回一个int值。

## java.lang.Thread
移除了两个臭名昭著的方法：`destroy()`和`stop(Throwable)`。撒花，庆祝...

## 其它
还有IO、java.security、Optional等有一些更新。具体可以查看参考文章。

# 新的GC
## ZGC
这绝对是让你的企业升级到Java 11的最大动力！ZGC是一款号称可以保证每次GC的停顿时间不超过10MS的垃圾回收器，并且和当前的默认垃圾回收起G1相比，吞吐量下降不超过15%。

请注意关键词，“不超过”，“10ms”。我只能说，Amazing！

后续本公众号会出一篇GC方面的文章，到时候会详细介绍ZGC。

## Epsilon
Java 11还加入了一个比较特殊的垃圾回收器——Epsilon，该垃圾收集器被称为“no-op”收集器，将会处理内存分配而不做任何实际的内存回收。 也就是说，这是一款不做垃圾回收的垃圾回收器。这个垃圾回收器看起来并没什么用，主要可以用来进行性能测试、内存压力测试等，Epsilon GC可以作为度量其他垃圾回收器性能的对照组。Epsilon GC至少能够帮助理解GC的接口，有助于成就一个更加模块化的JVM。

# 参考文章
[90 New Features and APIs in JDK 11 (Part 1)](https://dzone.com/articles/90-new-features-and-apis-in-jdk-11)