2018年9月25日，Oracle正式发布了Java 11。不同于Java 9与Java 10的是，Java 11是一个LTS(长期支持)的版本，Oracle表示会对Java 11提供大力支持，将会持续至2026年9月。

上一个LTS的版本是Java 8，Java 8将会支持到2025年。而且Java 8是一个改动较大的版本，相比于Java 7增加了很多新特性。所以很多企业目前使用的Java版本都是Java 8。

而Java 11作为下一个LTS版本，是绝对值得学习和尝试使用的。那Java1 1相对与Java8有哪些主要的改动呢？

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
- 