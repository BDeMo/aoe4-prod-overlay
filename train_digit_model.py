"""
Train AlexNet-style CNN on MNIST for digit recognition, export to ONNX.
Adapted architecture: input 32x32 grayscale (MNIST padded from 28x28).
"""
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader


class DigitAlexNet(nn.Module):
    """AlexNet adapted for 1x32x32 grayscale digit images."""
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3, stride=1, padding=1),   # 32x32
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),                   # 16x16

            nn.Conv2d(64, 192, kernel_size=3, padding=1),            # 16x16
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),                   # 8x8

            nn.Conv2d(192, 384, kernel_size=3, padding=1),           # 8x8
            nn.ReLU(inplace=True),

            nn.Conv2d(384, 256, kernel_size=3, padding=1),           # 8x8
            nn.ReLU(inplace=True),

            nn.Conv2d(256, 256, kernel_size=3, padding=1),           # 8x8
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),                   # 4x4
        )
        self.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(256 * 4 * 4, 1024),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(1024, 512),
            nn.ReLU(inplace=True),
            nn.Linear(512, 10),
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x


def main():
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")

    # Pad MNIST 28x28 → 32x32 for AlexNet
    transform = transforms.Compose([
        transforms.Pad(2),  # 28 → 32
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])

    data_dir = os.path.join(os.path.dirname(__file__), 'mnist_data')
    train_ds = datasets.MNIST(data_dir, train=True, download=True, transform=transform)
    test_ds = datasets.MNIST(data_dir, train=False, download=True, transform=transform)
    train_loader = DataLoader(train_ds, batch_size=128, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=256, shuffle=False, num_workers=0)

    model = DigitAlexNet().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)

    # Train
    for epoch in range(8):
        model.train()
        correct, total = 0, 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            out = model(imgs)
            loss = criterion(out, labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            correct += (out.argmax(1) == labels).sum().item()
            total += labels.size(0)
        scheduler.step()

        # Test accuracy
        model.eval()
        test_correct, test_total = 0, 0
        with torch.no_grad():
            for imgs, labels in test_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                out = model(imgs)
                test_correct += (out.argmax(1) == labels).sum().item()
                test_total += labels.size(0)

        print(f"Epoch {epoch+1}: train={correct/total*100:.1f}% test={test_correct/test_total*100:.2f}%")

    # Export to ONNX
    model.eval().cpu()
    dummy = torch.randn(1, 1, 32, 32)
    onnx_path = os.path.join(os.path.dirname(__file__), 'digit_model.onnx')

    try:
        torch.onnx.export(
            model, dummy, onnx_path,
            input_names=['input'], output_names=['output'],
            dynamic_axes={'input': {0: 'batch'}, 'output': {0: 'batch'}},
            opset_version=11, dynamo=False
        )
    except TypeError:
        torch.onnx.export(
            model, dummy, onnx_path,
            input_names=['input'], output_names=['output'],
            dynamic_axes={'input': {0: 'batch'}, 'output': {0: 'batch'}},
            opset_version=11
        )
    print(f"Exported to {onnx_path}")


if __name__ == '__main__':
    main()
