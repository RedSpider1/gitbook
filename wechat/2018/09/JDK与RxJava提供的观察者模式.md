# 引言
在前几天的文章里，我们介绍了设计模式里面的观察者模式，并用“热水壶”为案例，自己动手写了一个简单的观察者模式。

实际上，JDK提供了一些与观察者模式相关的**通用的**类和接口。同时，RxJava也提供了一些功能**更为完善**的观察者模式相关类和接口。

今天我们仍然以上次的案例为例，分别介绍JDK和RxJava提供的观察者模式的使用方法。

> 为了方便，今天我们的实力代码都写在一个Main方法里。

# JDK的观察者模式
主要使用到了两个类：
- `java.util.Observable`
- `java.util.Observer`

先上代码：
```java
public class Main {

    private static class MyThermos extends Observable {
        @Override
        public synchronized void setChanged() {
            super.setChanged();
        }
    }

    public static void main(String[] args) {
        MyThermos myThermos = new MyThermos();
        Observer jack = new Observer() {
            @Override
            public void update(Observable o, Object arg) {
                System.out.println("水开了，我要去泡面了");
            }
        };
        myThermos.addObserver(jack);
        myThermos.setChanged();
        myThermos.notifyObservers(); // no output
        myThermos.notifyObservers(); // 水开了，我要去泡面了
        myThermos.notifyObservers(); // no output
    }
}
```

## 继承一个Observable
也就是自己定义一个“被观察者”，继承`Observable`类。这个类实现了一些通用的“被观察者”的方法，比如这里我们使用到的`addObserver`，`notifyObservers`。

## changed
注意这里的`setChanged`方法。这个方法在`Observable`类里是`protected`的，源码：
```java
protected synchronized void setChanged() {
    changed = true;
}
```
这个`changed`有什么用呢？我们可以再看一下`notifyObservers`方法的源码：
```java
    public void notifyObservers() {
        notifyObservers(null);
    }

    public void notifyObservers(Object arg) {
        Object[] arrLocal;

        synchronized (this) {
            if (!changed)
                return;
            arrLocal = obs.toArray();
            clearChanged();
        }

        for (int i = arrLocal.length-1; i>=0; i--)
            ((Observer)arrLocal[i]).update(this, arg);
    }
```
很清晰吧！如果`changed`是`false`，那它直接就返回了，不会进行任何操作。否则，就调用所有“观察者”的`update`方法。并且会调用`clearChanged`方法重置`changed`为`false`。

所以我们的这段示例代码就很好解释了：
```java
myThermos.notifyObservers(); // no output
myThermos.notifyObservers(); // 水开了，我要去泡面了
myThermos.notifyObservers(); // no output
```

# RxJava的观察者模式
**RxJava**提供了一个更为完善的“观察者模式”。话不多说，先上代码：
```java
import io.reactivex.Observable;
import io.reactivex.ObservableEmitter;
import io.reactivex.ObservableOnSubscribe;
import io.reactivex.Observer;
import io.reactivex.disposables.Disposable;

public class RxJavaMain {
    public static void main(String[] args) {
        Observable<String> thermos = Observable.create(new ObservableOnSubscribe<String>() {
            @Override
            public void subscribe(ObservableEmitter<String> emitter) throws Exception {
                emitter.onNext("水开了");
                emitter.onNext("再说一声，水开了哈");
                emitter.onError(new Exception("出错啦，停电啦!"));
                emitter.onComplete();
            }
        });

        Observer<String> jack = new Observer<String>() {
            @Override
            public void onSubscribe(Disposable d) {
                System.out.println(d.isDisposed());
            }

            @Override
            public void onNext(String s) {
                System.out.println(String.format("jack said onNext: %s", s));
            }

            @Override
            public void onError(Throwable e) {
                System.out.println(String.format("jack said onError: %s", e.getMessage()));
            }

            @Override
            public void onComplete() {
                String.format("jack said onComplete");
            }
        };

        thermos.subscribe(jack);
    }
}
```
运行后输出：
```log
false
jack said onNext: 水开了
jack said onNext: 再说一声，水开了哈
jack said onError: 出错啦，停电啦!
```
## disposable
用于标志这个订阅（观察）是不是一次性订阅。

在上面的事例代码里，我们可以调用`d.dispose();`，就不会再有后面的输出了，因为“观察者”这个时候是一次性订阅，已经订阅完了。
## 消息泛型
可以看到，在RxJava提供的观察者模式里面，无论是`Observable`还是`Observer`，它们都有一个泛型声明。这个泛型是“消息”的类型（可以在`Observable`类的头部注释里看到这段说明），这里我使用的是`String`类型。

## onXX。
可以看到`Observable`类提供了一系列的`onXX`方法，主要有`onNext`、`onError`、`onComplete`这几个方法。
- onNext: 分阶段提供消息，会被Observer的onNext方法接收到消息。
- onError: 报异常，会被Observer的onError方法捕捉到异常。
- onComplete: 表示任务“完成”了，调用onComplete以后，Observer就不再接收/捕捉后面的onNext和onError。
  
## 更强大的功能
`Observable`类里面有大量的方法，有兴趣的读者可以进一步看看这个类的源码。除了我这段代码的事例之外，它主要还有这些功能：
- 阻塞
- 缓存
- 延迟
- 分组
- 重试
- ...
  
这是一个**非常大**的类，源码大概有**15000*行左右。可以说是RxJava的核心类了。有兴趣深入研究RxJava的读者可以挑一些方法看看具体实现。

# 总结
设计模式是一个灵活的东西，不是一成不变的。

比如观察者模式，我们可以根据自己的需求自己实现，或者用JDk提供的简单通用实现，也可以使用**RxJava**这种框架来使用更为完善的功能。

当然，其它设计模式也是一样，可以根据自己项目上的实际需求灵活多变。